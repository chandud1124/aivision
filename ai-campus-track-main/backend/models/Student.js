import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  rollNumber: {
    type: String,
    required: [true, 'Roll number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  admissionNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required']
  },
  program: {
    type: String,
    required: true,
    enum: ['UG', 'PG', 'PhD', 'Diploma']
  },
  course: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  section: {
    type: String,
    default: 'A'
  },
  batch: {
    type: String,
    required: true
  },
  rfidCard: {
    cardId: {
      type: String,
      unique: true,
      sparse: true
    },
    assignedAt: Date,
    isActive: {
      type: Boolean,
      default: false
    },
    lastTapAt: Date
  },
  faceData: {
    photos: [{
      url: String,
      uploadedAt: Date,
      quality: Number // 0-100
    }],
    embedding: {
      type: [Number],
      select: false // Face embedding vector
    },
    embeddingModel: String, // VGGFace, ArcFace, etc.
    lastTrainedAt: Date,
    isEnrolled: {
      type: Boolean,
      default: false
    }
  },
  academicInfo: {
    dateOfJoining: Date,
    expectedGraduation: Date,
    currentCGPA: Number,
    advisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  personalInfo: {
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },
    bloodGroup: String,
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: String
    }
  },
  guardianInfo: {
    name: String,
    relation: String,
    phone: String,
    email: String
  },
  attendanceStats: {
    totalClasses: {
      type: Number,
      default: 0
    },
    attended: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    },
    lastUpdated: Date
  },
  verificationStats: {
    totalScans: {
      type: Number,
      default: 0
    },
    successfulScans: {
      type: Number,
      default: 0
    },
    failedScans: {
      type: Number,
      default: 0
    },
    spoofAttempts: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'graduated', 'dropped'],
    default: 'active'
  },
  flags: {
    lowAttendance: {
      type: Boolean,
      default: false
    },
    multipleSpoofAttempts: {
      type: Boolean,
      default: false
    },
    rfidMismatch: {
      type: Boolean,
      default: false
    }
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
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
studentSchema.index({ rollNumber: 1 });
studentSchema.index({ 'rfidCard.cardId': 1 });
studentSchema.index({ department: 1, semester: 1, section: 1 });
studentSchema.index({ status: 1 });
studentSchema.index({ batch: 1 });

// Virtual populate for attendance records
studentSchema.virtual('attendanceRecords', {
  ref: 'Attendance',
  localField: '_id',
  foreignField: 'student'
});

// Method to update attendance stats
studentSchema.methods.updateAttendanceStats = async function() {
  const Attendance = mongoose.model('Attendance');
  
  const stats = await Attendance.aggregate([
    { $match: { student: this._id } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        attended: {
          $sum: {
            $cond: [{ $eq: ['$status', 'present'] }, 1, 0]
          }
        }
      }
    }
  ]);
  
  if (stats.length > 0) {
    this.attendanceStats.totalClasses = stats[0].total;
    this.attendanceStats.attended = stats[0].attended;
    this.attendanceStats.percentage = (stats[0].attended / stats[0].total) * 100;
    this.attendanceStats.lastUpdated = new Date();
    
    // Set low attendance flag
    this.flags.lowAttendance = this.attendanceStats.percentage < 75;
    
    await this.save();
  }
};

// Method to check if RFID is assigned
studentSchema.methods.hasRFID = function() {
  return this.rfidCard.cardId && this.rfidCard.isActive;
};

// Method to check if face is enrolled
studentSchema.methods.hasFaceEnrolled = function() {
  return this.faceData.isEnrolled && this.faceData.embedding && this.faceData.embedding.length > 0;
};

const Student = mongoose.model('Student', studentSchema);

export default Student;
