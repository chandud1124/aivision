import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'face-mismatch',
      'spoof-detected',
      'unknown-face',
      'duplicate-rfid',
      'camera-offline',
      'rfid-offline',
      'low-attendance',
      'no-verification',
      'device-malfunction',
      'security-breach',
      'system-error'
    ],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true,
    default: 'medium'
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  source: {
    module: {
      type: String,
      enum: ['attendance', 'device', 'camera', 'rfid', 'ai-service', 'system']
    },
    entityType: String, // e.g., 'Camera', 'RFIDDevice', 'Student'
    entityId: mongoose.Schema.Types.ObjectId
  },
  affectedUsers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: String,
    notified: {
      type: Boolean,
      default: false
    },
    notifiedAt: Date,
    readAt: Date
  }],
  relatedData: {
    attendance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attendance'
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    camera: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Camera'
    },
    rfidDevice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RFIDDevice'
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class'
    }
  },
  evidence: [{
    type: {
      type: String,
      enum: ['image', 'video', 'log', 'screenshot']
    },
    url: String,
    metadata: Object
  }],
  status: {
    type: String,
    enum: ['unread', 'read', 'acknowledged', 'in-progress', 'resolved', 'dismissed'],
    default: 'unread'
  },
  resolution: {
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date,
    action: String,
    notes: String
  },
  autoResolve: {
    enabled: {
      type: Boolean,
      default: false
    },
    resolveAfterHours: Number
  },
  notifications: {
    email: {
      sent: { type: Boolean, default: false },
      sentAt: Date
    },
    sms: {
      sent: { type: Boolean, default: false },
      sentAt: Date
    },
    push: {
      sent: { type: Boolean, default: false },
      sentAt: Date
    }
  },
  expiresAt: Date,
  metadata: {
    ipAddress: String,
    userAgent: String,
    additionalInfo: Object
  }
}, {
  timestamps: true
});

// Indexes
alertSchema.index({ type: 1, status: 1 });
alertSchema.index({ severity: 1, createdAt: -1 });
alertSchema.index({ 'affectedUsers.user': 1, status: 1 });
alertSchema.index({ createdAt: -1 });
alertSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Method to mark as resolved
alertSchema.methods.resolve = async function(userId, action, notes) {
  this.status = 'resolved';
  this.resolution = {
    resolvedBy: userId,
    resolvedAt: new Date(),
    action,
    notes
  };
  
  return await this.save();
};

// Method to notify users
alertSchema.methods.notifyUsers = async function() {
  const promises = this.affectedUsers.map(async (affectedUser) => {
    // Mark as notified
    affectedUser.notified = true;
    affectedUser.notifiedAt = new Date();
  });
  
  await Promise.all(promises);
  return await this.save();
};

// Static method to get unresolved alerts
alertSchema.statics.getUnresolved = function(userId, role) {
  const query = {
    status: { $in: ['unread', 'read', 'acknowledged', 'in-progress'] }
  };
  
  if (role !== 'superadmin') {
    query['affectedUsers.user'] = userId;
  }
  
  return this.find(query).sort({ createdAt: -1 }).populate('relatedData.student relatedData.camera relatedData.rfidDevice');
};

const Alert = mongoose.model('Alert', alertSchema);

export default Alert;
