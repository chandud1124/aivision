import express from 'express';
import { body } from 'express-validator';
import {
  rfidTap,
  verifyFace,
  getAttendance,
  getClassAttendance,
  getStudentAttendance,
  markManualAttendance,
  updateAttendance,
  getHourlyLogs,
  exportAttendance
} from '../controllers/attendanceController.js';
import { protect, authorize, authenticateDevice } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

// Device routes (RFID readers and cameras)
router.post('/rfid-tap', authenticateDevice, rfidTap);
router.post('/verify-face', authenticateDevice, verifyFace);

// Protected routes
router.get('/', protect, getAttendance);
router.get('/class/:classId', protect, getClassAttendance);
router.get('/student/:studentId', protect, getStudentAttendance);
router.get('/hourly', protect, authorize('superadmin', 'hod', 'teacher'), getHourlyLogs);

// Manual attendance
router.post(
  '/manual',
  protect,
  authorize('superadmin', 'hod', 'teacher'),
  [
    body('studentId').notEmpty().withMessage('Student ID is required'),
    body('classId').notEmpty().withMessage('Class ID is required'),
    body('status').isIn(['present', 'absent', 'late', 'excused']).withMessage('Invalid status')
  ],
  validate,
  markManualAttendance
);

// Update attendance
router.put(
  '/:id',
  protect,
  authorize('superadmin', 'hod', 'teacher'),
  updateAttendance
);

// Export attendance
router.get('/export', protect, exportAttendance);

export default router;
