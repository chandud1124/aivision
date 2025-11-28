import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';
import RFIDDevice from '../models/RFIDDevice.js';
import Camera from '../models/Camera.js';
import Alert from '../models/Alert.js';
import logger from '../config/logger.js';
import { emitToAll, emitToRole } from '../config/socket.js';
import { callAIService } from '../services/aiService.js';
import dayjs from 'dayjs';

// @desc    Handle RFID tap event
// @route   POST /api/attendance/rfid-tap
// @access  Device (API Key)
export const rfidTap = async (req, res, next) => {
  try {
    const { cardId, timestamp } = req.body;
    const rfidDevice = req.device;

    logger.info(`RFID tap received: Card ${cardId} at device ${rfidDevice.deviceId}`);

    // Find student by RFID card
    const student = await Student.findOne({
      'rfidCard.cardId': cardId,
      'rfidCard.isActive': true,
      status: 'active'
    }).populate('user department');

    if (!student) {
      logger.warn(`Unknown RFID card tapped: ${cardId}`);
      
      // Create alert for unknown card
      await Alert.create({
        type: 'duplicate-rfid',
        severity: 'medium',
        title: 'Unknown RFID Card',
        message: `Unknown card ${cardId} tapped at ${rfidDevice.name}`,
        source: {
          module: 'rfid',
          entityType: 'RFIDDevice',
          entityId: rfidDevice._id
        }
      });

      return res.status(404).json({
        success: false,
        message: 'Unknown RFID card',
        action: 'show_red_led'
      });
    }

    // Check for duplicate tap within window
    const duplicateWindow = parseInt(process.env.RFID_TAP_DUPLICATE_WINDOW_SECONDS) || 300;
    const recentTap = await Attendance.findOne({
      student: student._id,
      'rfidTap.cardId': cardId,
      'rfidTap.tapTime': {
        $gte: new Date(Date.now() - duplicateWindow * 1000)
      }
    });

    if (recentTap) {
      logger.warn(`Duplicate RFID tap detected for student ${student.rollNumber}`);
      
      return res.status(409).json({
        success: false,
        message: 'Card already tapped recently',
        action: 'show_yellow_led'
      });
    }

    // Get linked camera
    const camera = await Camera.findOne({
      _id: rfidDevice.linkedCamera,
      isActive: true
    });

    if (!camera) {
      logger.error(`No camera linked to RFID device ${rfidDevice.deviceId}`);
      
      return res.status(500).json({
        success: false,
        message: 'No camera available for verification',
        action: 'show_red_led'
      });
    }

    // Create pending attendance record
    const attendance = await Attendance.create({
      student: student._id,
      class: rfidDevice.classroom,
      date: new Date(),
      status: 'pending',
      markedBy: 'rfid-auto',
      rfidTap: {
        cardId,
        tapTime: timestamp || new Date(),
        rfidDevice: rfidDevice._id
      },
      location: {
        classroom: rfidDevice.location.classroom,
        building: rfidDevice.location.building,
        camera: camera._id
      },
      faceVerification: {
        verified: false,
        attemptCount: 0,
        finalResult: 'pending'
      }
    });

    // Update student's last tap time
    student.rfidCard.lastTapAt = new Date();
    await student.save();

    // Update device stats
    await rfidDevice.recordScan(true);

    // Broadcast event via WebSocket
    emitToAll('attendance:rfid-tap', {
      studentId: student._id,
      studentName: student.user.fullName,
      rollNumber: student.rollNumber,
      cardId,
      deviceId: rfidDevice.deviceId,
      cameraId: camera._id,
      attendanceId: attendance._id,
      timestamp: new Date()
    });

    logger.info(`RFID tap processed for ${student.rollNumber}, awaiting face verification`);

    // Return instructions to trigger camera
    res.status(200).json({
      success: true,
      message: 'RFID verified, capture face',
      action: 'capture_face',
      data: {
        attendanceId: attendance._id,
        studentId: student._id,
        studentName: student.user.fullName,
        rollNumber: student.rollNumber,
        cameraId: camera._id,
        cameraUrl: camera.streamConfig.url
      }
    });
  } catch (error) {
    logger.error('RFID tap error:', error);
    next(error);
  }
};

// @desc    Verify face after RFID tap
// @route   POST /api/attendance/verify-face
// @access  Device (API Key)
export const verifyFace = async (req, res, next) => {
  try {
    const { attendanceId, imageBase64, studentId } = req.body;
    const camera = req.device;

    logger.info(`Face verification initiated for attendance ${attendanceId}`);

    // Find attendance record
    const attendance = await Attendance.findById(attendanceId).populate('student');

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    const student = await Student.findById(studentId || attendance.student._id);

    if (!student.hasFaceEnrolled()) {
      logger.warn(`Face not enrolled for student ${student.rollNumber}`);
      
      await Alert.create({
        type: 'no-verification',
        severity: 'high',
        title: 'Face Not Enrolled',
        message: `Student ${student.rollNumber} has not enrolled their face`,
        relatedData: {
          student: student._id,
          attendance: attendance._id
        }
      });

      return res.status(400).json({
        success: false,
        message: 'Face not enrolled for this student',
        action: 'show_red_led'
      });
    }

    // Call AI service for face verification
    const aiResult = await callAIService('/api/ai/verify-face', {
      imageBase64,
      studentId: student._id,
      embedding: student.faceData.embedding
    });

    // Record attempt
    attendance.faceVerification.attemptCount += 1;
    attendance.faceVerification.attempts.push({
      timestamp: new Date(),
      result: aiResult.match ? 'match' : aiResult.spoofDetected ? 'spoof-detected' : 'mismatch',
      confidence: aiResult.confidence,
      camera: camera._id,
      imageUrl: aiResult.imageUrl,
      antiSpoof: {
        isLive: aiResult.antiSpoof.isLive,
        confidence: aiResult.antiSpoof.confidence,
        method: 'MediaPipe'
      }
    });

    // Update student verification stats
    student.verificationStats.totalScans += 1;

    // Handle spoof detection
    if (aiResult.spoofDetected) {
      logger.warn(`Spoof detected for student ${student.rollNumber}`);
      
      student.verificationStats.spoofAttempts += 1;
      await student.save();

      await attendance.markSpoofDetected(aiResult.imageUrl);

      // Create critical alert
      await Alert.create({
        type: 'spoof-detected',
        severity: 'critical',
        title: 'Spoofing Attempt Detected',
        message: `Fake face detected for student ${student.rollNumber}`,
        relatedData: {
          student: student._id,
          attendance: attendance._id,
          camera: camera._id
        },
        evidence: [{
          type: 'image',
          url: aiResult.imageUrl
        }],
        affectedUsers: [{
          role: 'hod'
        }, {
          role: 'superadmin'
        }]
      });

      emitToRole('teacher', 'attendance:spoof-detected', {
        studentId: student._id,
        studentName: student.user.fullName,
        rollNumber: student.rollNumber,
        imageUrl: aiResult.imageUrl
      });

      return res.status(403).json({
        success: false,
        message: 'Spoof detected',
        action: 'show_red_led_blink',
        data: {
          spoofDetected: true
        }
      });
    }

    // Handle face match
    if (aiResult.match && aiResult.confidence >= 0.85) {
      logger.info(`Face verified successfully for student ${student.rollNumber}`);
      
      await attendance.markVerified(aiResult.confidence, camera._id);
      
      student.verificationStats.successfulScans += 1;
      await student.save();

      // Update camera stats
      camera.stats.totalFacesDetected += 1;
      await camera.save();

      emitToAll('attendance:verified', {
        attendanceId: attendance._id,
        studentId: student._id,
        studentName: student.user.fullName,
        rollNumber: student.rollNumber,
        confidence: aiResult.confidence,
        timestamp: new Date()
      });

      return res.status(200).json({
        success: true,
        message: 'Attendance marked successfully',
        action: 'show_green_led',
        data: {
          studentName: student.user.fullName,
          rollNumber: student.rollNumber,
          confidence: aiResult.confidence,
          status: 'present'
        }
      });
    }

    // Face mismatch - check retry count
    student.verificationStats.failedScans += 1;
    await student.save();

    const maxRetries = parseInt(process.env.VERIFICATION_RETRY_COUNT) || 2;

    if (attendance.faceVerification.attemptCount >= maxRetries) {
      logger.warn(`Face verification failed after ${maxRetries} attempts for ${student.rollNumber}`);
      
      await attendance.markVerificationFailed('max_retries_exceeded');

      // Create alert for teacher
      await Alert.create({
        type: 'face-mismatch',
        severity: 'high',
        title: 'Face Verification Failed',
        message: `Face mismatch for ${student.rollNumber} after ${maxRetries} attempts`,
        relatedData: {
          student: student._id,
          attendance: attendance._id,
          camera: camera._id
        }
      });

      emitToRole('teacher', 'attendance:verification-failed', {
        studentId: student._id,
        studentName: student.user.fullName,
        rollNumber: student.rollNumber,
        attempts: maxRetries
      });

      return res.status(400).json({
        success: false,
        message: 'Face verification failed',
        action: 'show_red_led',
        data: {
          reason: 'Face mismatch',
          attempts: maxRetries
        }
      });
    }

    // Allow retry
    await attendance.save();

    return res.status(400).json({
      success: false,
      message: 'Face mismatch, please try again',
      action: 'retry_capture',
      data: {
        attemptsLeft: maxRetries - attendance.faceVerification.attemptCount
      }
    });

  } catch (error) {
    logger.error('Face verification error:', error);
    next(error);
  }
};

// @desc    Get attendance records
// @route   GET /api/attendance
// @access  Private
export const getAttendance = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, status, date, classId, studentId } = req.query;

    const query = {};

    if (status) query.status = status;
    if (date) {
      query.date = {
        $gte: dayjs(date).startOf('day').toDate(),
        $lte: dayjs(date).endOf('day').toDate()
      };
    }
    if (classId) query.class = classId;
    if (studentId) query.student = studentId;

    // Role-based filtering
    if (req.user.role === 'student') {
      const student = await Student.findOne({ user: req.user._id });
      query.student = student._id;
    } else if (req.user.role === 'teacher') {
      query.teacher = req.user._id;
    } else if (req.user.role === 'hod') {
      query['student.department'] = req.user.department;
    }

    const attendance = await Attendance.find(query)
      .populate('student', 'rollNumber user')
      .populate({ path: 'student', populate: { path: 'user', select: 'firstName lastName' } })
      .populate('class', 'name')
      .sort({ date: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Attendance.countDocuments(query);

    res.status(200).json({
      success: true,
      count: attendance.length,
      total: count,
      pages: Math.ceil(count / limit),
      currentPage: page,
      data: attendance
    });
  } catch (error) {
    logger.error('Get attendance error:', error);
    next(error);
  }
};

// @desc    Get class attendance
// @route   GET /api/attendance/class/:classId
// @access  Private
export const getClassAttendance = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { date } = req.query;

    const query = {
      class: classId,
      date: date ? {
        $gte: dayjs(date).startOf('day').toDate(),
        $lte: dayjs(date).endOf('day').toDate()
      } : {
        $gte: dayjs().startOf('day').toDate(),
        $lte: dayjs().endOf('day').toDate()
      }
    };

    const attendance = await Attendance.find(query)
      .populate('student')
      .populate({ path: 'student', populate: { path: 'user' } })
      .sort({ 'student.rollNumber': 1 });

    // Get summary
    const summary = await Attendance.getSummary({ classId, date });

    res.status(200).json({
      success: true,
      data: attendance,
      summary
    });
  } catch (error) {
    logger.error('Get class attendance error:', error);
    next(error);
  }
};

// @desc    Get student attendance
// @route   GET /api/attendance/student/:studentId
// @access  Private
export const getStudentAttendance = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    const query = { student: studentId };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(query)
      .populate('class', 'name')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance
    });
  } catch (error) {
    logger.error('Get student attendance error:', error);
    next(error);
  }
};

// @desc    Mark manual attendance
// @route   POST /api/attendance/manual
// @access  Private (Teacher+)
export const markManualAttendance = async (req, res, next) => {
  try {
    const { studentId, classId, status, reason } = req.body;

    const attendance = await Attendance.create({
      student: studentId,
      class: classId,
      date: new Date(),
      status,
      markedBy: 'manual',
      teacher: req.user._id,
      manualOverride: {
        overridden: true,
        by: req.user._id,
        reason,
        timestamp: new Date()
      }
    });

    logger.info(`Manual attendance marked by ${req.user.email} for student ${studentId}`);

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: attendance
    });
  } catch (error) {
    logger.error('Manual attendance error:', error);
    next(error);
  }
};

// @desc    Update attendance
// @route   PUT /api/attendance/:id
// @access  Private (Teacher+)
export const updateAttendance = async (req, res, next) => {
  try {
    const { status, reason } = req.body;

    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    const previousStatus = attendance.status;

    attendance.status = status;
    attendance.manualOverride = {
      overridden: true,
      by: req.user._id,
      reason,
      timestamp: new Date(),
      previousStatus
    };

    await attendance.save();

    logger.info(`Attendance updated by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Attendance updated successfully',
      data: attendance
    });
  } catch (error) {
    logger.error('Update attendance error:', error);
    next(error);
  }
};

// @desc    Get hourly attendance logs
// @route   GET /api/attendance/hourly
// @access  Private (Teacher+)
export const getHourlyLogs = async (req, res, next) => {
  try {
    const { date, classId } = req.query;

    const query = {
      session: 'hourly',
      date: date ? {
        $gte: dayjs(date).startOf('day').toDate(),
        $lte: dayjs(date).endOf('day').toDate()
      } : {
        $gte: dayjs().startOf('day').toDate(),
        $lte: dayjs().endOf('day').toDate()
      }
    };

    if (classId) query.class = classId;

    const logs = await Attendance.find(query)
      .populate('student')
      .populate('class')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    logger.error('Get hourly logs error:', error);
    next(error);
  }
};

// @desc    Export attendance
// @route   GET /api/attendance/export
// @access  Private
export const exportAttendance = async (req, res, next) => {
  try {
    const { format = 'csv', startDate, endDate, classId } = req.query;

    const query = {};

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (classId) query.class = classId;

    const attendance = await Attendance.find(query)
      .populate('student')
      .populate({ path: 'student', populate: { path: 'user' } })
      .populate('class');

    // TODO: Implement CSV/Excel export logic
    res.status(200).json({
      success: true,
      message: 'Export feature coming soon',
      data: attendance
    });
  } catch (error) {
    logger.error('Export attendance error:', error);
    next(error);
  }
};

export default {
  rfidTap,
  verifyFace,
  getAttendance,
  getClassAttendance,
  getStudentAttendance,
  markManualAttendance,
  updateAttendance,
  getHourlyLogs,
  exportAttendance
};
