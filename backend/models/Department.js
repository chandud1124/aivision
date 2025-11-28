import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Department name is required'],
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Department code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  description: String,
  hod: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  faculty: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  programs: [{
    name: String,
    code: String,
    duration: Number, // in semesters
    type: {
      type: String,
      enum: ['UG', 'PG', 'PhD', 'Diploma']
    }
  }],
  building: String,
  floor: String,
  contactInfo: {
    email: String,
    phone: String,
    office: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  stats: {
    totalStudents: { type: Number, default: 0 },
    totalFaculty: { type: Number, default: 0 },
    averageAttendance: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

departmentSchema.index({ code: 1 });
departmentSchema.index({ name: 1 });

const Department = mongoose.model('Department', departmentSchema);

export default Department;
