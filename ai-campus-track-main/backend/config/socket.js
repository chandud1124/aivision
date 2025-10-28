import logger from './logger.js';

let io = null;

export const initializeSocketIO = (socketIO) => {
  io = socketIO;
  
  io.on('connection', (socket) => {
    logger.info(`🔌 Client connected: ${socket.id}`);
    
    // Join room based on user role/department
    socket.on('join', (data) => {
      const { userId, role, departmentId } = data;
      
      // Join user-specific room
      socket.join(`user:${userId}`);
      
      // Join role-based room
      socket.join(`role:${role}`);
      
      // Join department room if applicable
      if (departmentId) {
        socket.join(`department:${departmentId}`);
      }
      
      logger.info(`User ${userId} joined rooms: user:${userId}, role:${role}${departmentId ? `, department:${departmentId}` : ''}`);
    });
    
    // Handle RFID tap events from devices
    socket.on('rfid:tap', (data) => {
      logger.info('RFID tap received:', data);
      io.emit('rfid:tap:broadcast', data);
    });
    
    // Handle face verification results
    socket.on('face:verification', (data) => {
      logger.info('Face verification result:', data);
      io.emit('face:verification:broadcast', data);
    });
    
    // Handle camera status updates
    socket.on('camera:status', (data) => {
      io.emit('camera:status:broadcast', data);
    });
    
    // Handle RFID device status updates
    socket.on('rfid:status', (data) => {
      io.emit('rfid:status:broadcast', data);
    });
    
    // Disconnect handler
    socket.on('disconnect', () => {
      logger.info(`🔌 Client disconnected: ${socket.id}`);
    });
  });
  
  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO has not been initialized');
  }
  return io;
};

// Emit events to specific users/rooms
export const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

export const emitToRole = (role, event, data) => {
  if (io) {
    io.to(`role:${role}`).emit(event, data);
  }
};

export const emitToDepartment = (departmentId, event, data) => {
  if (io) {
    io.to(`department:${departmentId}`).emit(event, data);
  }
};

export const emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

export default { initializeSocketIO, getIO, emitToUser, emitToRole, emitToDepartment, emitToAll };
