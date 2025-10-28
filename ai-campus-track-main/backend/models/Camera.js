import mongoose from 'mongoose';

const cameraSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Camera name is required'],
    trim: true
  },
  cameraId: {
    type: String,
    required: [true, 'Camera ID is required'],
    unique: true
  },
  type: {
    type: String,
    enum: ['ip', 'rtsp', 'usb', 'esp32-cam', 'raspberry-pi'],
    required: true
  },
  location: {
    building: String,
    floor: String,
    classroom: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  classroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  },
  streamConfig: {
    url: {
      type: String,
      required: true
    },
    protocol: {
      type: String,
      enum: ['rtsp', 'http', 'https', 'websocket']
    },
    port: Number,
    username: String,
    password: {
      type: String,
      select: false
    },
    resolution: {
      width: { type: Number, default: 1920 },
      height: { type: Number, default: 1080 }
    },
    fps: {
      type: Number,
      default: 30
    },
    codec: String
  },
  aiSettings: {
    faceDetectionEnabled: {
      type: Boolean,
      default: true
    },
    detectionMode: {
      type: String,
      enum: ['continuous', 'rfid-triggered', 'scheduled'],
      default: 'rfid-triggered'
    },
    captureInterval: {
      type: Number,
      default: 1000 // milliseconds
    },
    qualityThreshold: {
      type: Number,
      default: 70 // 0-100
    }
  },
  status: {
    isOnline: {
      type: Boolean,
      default: false
    },
    lastSeen: Date,
    lastFrameAt: Date,
    currentFPS: Number,
    streamHealth: {
      type: String,
      enum: ['good', 'fair', 'poor', 'offline'],
      default: 'offline'
    }
  },
  linkedDevices: [{
    rfidReader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RFIDDevice'
    }
  }],
  maintenance: {
    lastMaintenance: Date,
    nextScheduled: Date,
    issues: [{
      description: String,
      reportedAt: Date,
      status: {
        type: String,
        enum: ['open', 'in-progress', 'resolved']
      }
    }]
  },
  stats: {
    totalFramesCaptured: { type: Number, default: 0 },
    totalFacesDetected: { type: Number, default: 0 },
    uptime: { type: Number, default: 0 }, // in hours
    averageQuality: { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

cameraSchema.index({ cameraId: 1 });
cameraSchema.index({ classroom: 1 });
cameraSchema.index({ 'status.isOnline': 1 });

// Method to update status
cameraSchema.methods.updateStatus = async function(isOnline, fps = null) {
  this.status.isOnline = isOnline;
  this.status.lastSeen = new Date();
  
  if (isOnline) {
    if (fps) this.status.currentFPS = fps;
    this.status.streamHealth = fps >= 20 ? 'good' : fps >= 10 ? 'fair' : 'poor';
  } else {
    this.status.streamHealth = 'offline';
  }
  
  return await this.save();
};

const Camera = mongoose.model('Camera', cameraSchema);

export default Camera;
