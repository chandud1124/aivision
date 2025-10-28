import mongoose from 'mongoose';

const rfidDeviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: [true, 'Device ID is required'],
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Device name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['mfrc522', 'pn532', 'em4100', '125khz', 'custom'],
    required: true
  },
  hardware: {
    type: String,
    enum: ['esp32', 'esp8266', 'nodemcu', 'raspberry-pi', 'arduino', 'other'],
    required: true
  },
  location: {
    building: String,
    floor: String,
    classroom: String,
    entrance: String
  },
  classroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class'
  },
  networkConfig: {
    ipAddress: String,
    macAddress: String,
    port: Number,
    apiEndpoint: String
  },
  authentication: {
    apiKey: {
      type: String,
      required: true,
      select: false
    },
    secret: {
      type: String,
      select: false
    }
  },
  linkedCamera: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Camera'
  },
  settings: {
    readMode: {
      type: String,
      enum: ['single', 'continuous'],
      default: 'single'
    },
    scanTimeout: {
      type: Number,
      default: 5000 // milliseconds
    },
    duplicateScanWindow: {
      type: Number,
      default: 300 // seconds
    },
    buzzOnScan: {
      type: Boolean,
      default: true
    },
    ledFeedback: {
      type: Boolean,
      default: true
    }
  },
  status: {
    isOnline: {
      type: Boolean,
      default: false
    },
    lastSeen: Date,
    lastScanAt: Date,
    health: {
      type: String,
      enum: ['good', 'fair', 'poor', 'offline'],
      default: 'offline'
    },
    signalStrength: Number // RSSI for wireless devices
  },
  firmware: {
    version: String,
    lastUpdated: Date
  },
  stats: {
    totalScans: { type: Number, default: 0 },
    successfulScans: { type: Number, default: 0 },
    failedScans: { type: Number, default: 0 },
    uptime: { type: Number, default: 0 } // in hours
  },
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
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

rfidDeviceSchema.index({ deviceId: 1 });
rfidDeviceSchema.index({ classroom: 1 });
rfidDeviceSchema.index({ 'status.isOnline': 1 });

// Method to update status
rfidDeviceSchema.methods.updateStatus = async function(isOnline) {
  this.status.isOnline = isOnline;
  this.status.lastSeen = new Date();
  this.status.health = isOnline ? 'good' : 'offline';
  
  return await this.save();
};

// Method to record scan
rfidDeviceSchema.methods.recordScan = async function(success = true) {
  this.stats.totalScans += 1;
  if (success) {
    this.stats.successfulScans += 1;
  } else {
    this.stats.failedScans += 1;
  }
  this.status.lastScanAt = new Date();
  
  return await this.save();
};

const RFIDDevice = mongoose.model('RFIDDevice', rfidDeviceSchema);

export default RFIDDevice;
