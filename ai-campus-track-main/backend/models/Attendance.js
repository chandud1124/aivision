import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  session: {
    type: String,
    enum: ['morning', 'afternoon', 'evening', 'hourly'],
    default: 'hourly'
  },
  period: {
    type: Number,
    min: 1,
    max: 10
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'excused', 'pending'],
    required: true,
    default: 'pending'
  },
  markedBy: {
    type: String,
    enum: ['rfid-auto', 'manual', 'hourly-check', 'period-start', 'period-end'],
    required: true
  },
  rfidTap: {
    cardId: String,
    tapTime: Date,
    rfidDevice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RFIDDevice'
    }
  },
  faceVerification: {
    verified: {
      type: Boolean,
      default: false
    },
    confidence: Number, // 0-1
    attemptCount: {
      type: Number,
      default: 0
    },
    attempts: [{
      timestamp: Date,
      result: {
        type: String,
        enum: ['match', 'mismatch', 'no-face', 'multiple-faces', 'spoof-detected', 'error']
      },
      confidence: Number,
      camera: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Camera'
      },
      imageUrl: String,
      antiSpoof: {
        isLive: Boolean,
        confidence: Number,
        method: String // MediaPipe, CNN, etc.
      }
    }],
    finalResult: {
      type: String,
      enum: ['verified', 'failed', 'spoof-detected', 'pending']
    },
    verifiedAt: Date
  },
  location: {
    classroom: String,
    building: String,
    camera: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Camera'
    }
  },
  timing: {
    expectedTime: Date,
    actualTime: Date,
    lateDuration: Number // in minutes
  },
  manualOverride: {
    overridden: {
      type: Boolean,
      default: false
    },
    by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    timestamp: Date,
    previousStatus: String
  },
  alerts: [{
    type: {
      type: String,
      enum: ['face-mismatch', 'spoof-detected', 'duplicate-rfid', 'no-verification', 'late-arrival']
    },
    message: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    },
    triggeredAt: Date,
    resolved: {
      type: Boolean,
      default: false
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date
  }],
  metadata: {
    ipAddress: String,
    userAgent: String,
    deviceInfo: Object
  },
  notes: [{
    content: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Compound indexes for efficient queries
attendanceSchema.index({ student: 1, date: -1 });
attendanceSchema.index({ class: 1, date: -1 });
attendanceSchema.index({ status: 1, date: -1 });
attendanceSchema.index({ 'rfidTap.cardId': 1, date: -1 });
attendanceSchema.index({ date: -1, session: 1 });

// Prevent duplicate attendance for same student, class, and period
attendanceSchema.index(
  { student: 1, class: 1, date: 1, period: 1 },
  { unique: true, sparse: true }
);

// Method to mark as verified
attendanceSchema.methods.markVerified = function(confidence, camera) {
  this.faceVerification.verified = true;
  this.faceVerification.confidence = confidence;
  this.faceVerification.finalResult = 'verified';
  this.faceVerification.verifiedAt = new Date();
  this.status = 'present';
  
  return this.save();
};

// Method to mark as failed verification
attendanceSchema.methods.markVerificationFailed = function(reason) {
  this.faceVerification.finalResult = 'failed';
  
  if (this.faceVerification.attemptCount >= parseInt(process.env.VERIFICATION_RETRY_COUNT || 2)) {
    // Create alert for teacher
    this.alerts.push({
      type: 'no-verification',
      message: `Face verification failed after ${this.faceVerification.attemptCount} attempts`,
      severity: 'high',
      triggeredAt: new Date()
    });
  }
  
  return this.save();
};

// Method to detect spoof
attendanceSchema.methods.markSpoofDetected = function(imageUrl) {
  this.faceVerification.finalResult = 'spoof-detected';
  this.status = 'absent';
  
  this.alerts.push({
    type: 'spoof-detected',
    message: 'Anti-spoofing detection triggered - fake face detected',
    severity: 'critical',
    triggeredAt: new Date()
  });
  
  return this.save();
};

// Static method to get attendance summary
attendanceSchema.statics.getSummary = async function(filters) {
  const { classId, date, startDate, endDate } = filters;
  
  const matchStage = { class: mongoose.Types.ObjectId(classId) };
  
  if (date) {
    matchStage.date = new Date(date);
  } else if (startDate && endDate) {
    matchStage.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  return await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;
