import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  role: {
    type: String,
    enum: ['superadmin', 'hod', 'teacher', 'student', 'technician'],
    required: [true, 'Role is required'],
    default: 'student'
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[0-9]{10,15}$/, 'Please provide a valid phone number']
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  profilePhoto: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: null
  },
  passwordChangedAt: {
    type: Date
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  refreshToken: {
    type: String,
    select: false
  },
  permissions: [{
    module: {
      type: String,
      enum: ['dashboard', 'users', 'students', 'staff', 'attendance', 'devices', 'cameras', 'reports', 'alerts', 'settings', 'logs']
    },
    actions: [{
      type: String,
      enum: ['create', 'read', 'update', 'delete', 'export']
    }]
  }],
  preferences: {
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true }
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    }
  },
  metadata: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ department: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  this.password = await bcrypt.hash(this.password, rounds);
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to check if password was changed after token issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Static method to get role permissions
userSchema.statics.getRolePermissions = function(role) {
  const rolePermissions = {
    superadmin: [
      { module: 'dashboard', actions: ['read'] },
      { module: 'users', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'students', actions: ['create', 'read', 'update', 'delete', 'export'] },
      { module: 'staff', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'attendance', actions: ['create', 'read', 'update', 'delete', 'export'] },
      { module: 'devices', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'cameras', actions: ['create', 'read', 'update', 'delete'] },
      { module: 'reports', actions: ['read', 'export'] },
      { module: 'alerts', actions: ['read', 'update'] },
      { module: 'settings', actions: ['read', 'update'] },
      { module: 'logs', actions: ['read', 'export'] }
    ],
    hod: [
      { module: 'dashboard', actions: ['read'] },
      { module: 'users', actions: ['read'] },
      { module: 'students', actions: ['create', 'read', 'update', 'export'] },
      { module: 'staff', actions: ['read'] },
      { module: 'attendance', actions: ['read', 'update', 'export'] },
      { module: 'devices', actions: ['read'] },
      { module: 'cameras', actions: ['read'] },
      { module: 'reports', actions: ['read', 'export'] },
      { module: 'alerts', actions: ['read', 'update'] }
    ],
    teacher: [
      { module: 'dashboard', actions: ['read'] },
      { module: 'students', actions: ['read'] },
      { module: 'attendance', actions: ['read', 'update'] },
      { module: 'alerts', actions: ['read', 'update'] },
      { module: 'reports', actions: ['read'] }
    ],
    student: [
      { module: 'dashboard', actions: ['read'] },
      { module: 'attendance', actions: ['read'] },
      { module: 'alerts', actions: ['read'] }
    ],
    technician: [
      { module: 'devices', actions: ['create', 'read', 'update'] },
      { module: 'cameras', actions: ['create', 'read', 'update'] },
      { module: 'logs', actions: ['read'] }
    ]
  };
  
  return rolePermissions[role] || [];
};

const User = mongoose.model('User', userSchema);

export default User;
