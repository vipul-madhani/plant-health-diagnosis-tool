const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const Consultation = require('../models/Consultation');
const { sendEmail } = require('./email');

let io;

// ========================================
// Initialize Socket.io Server
// ========================================
function initializeSocket(server) {
  io = socketIo(server, {
    cors: {
      origin: process.env.SOCKET_CORS_ORIGIN?.split(',') || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // ========================================
    // Join Consultation Room
    // ========================================
    socket.on('join_consultation', async ({ consultationId }) => {
      try {
        const consultation = await Consultation.findById(consultationId)
          .populate('farmerId', 'name email')
          .populate('agronomistId', 'name email');

        if (!consultation) {
          socket.emit('error', { message: 'Consultation not found' });
          return;
        }

        // Verify user is part of this consultation
        const isFarmer = consultation.farmerId._id.toString() === socket.userId;
        const isAgronomist =
          consultation.agronomistId?._id.toString() === socket.userId;

        if (!isFarmer && !isAgronomist) {
          socket.emit('error', { message: 'Unauthorized access' });
          return;
        }

        // Join room
        socket.join(`consultation_${consultationId}`);
        socket.consultationId = consultationId;

        console.log(
          `User ${socket.userId} joined consultation ${consultationId}`
        );

        // Load chat history
        const messages = await Message.find({ consultationId })
          .sort({ createdAt: 1 })
          .limit(50)
          .populate('senderId', 'name role');

        socket.emit('chat_history', { messages });

        // Notify room that user joined
        socket.to(`consultation_${consultationId}`).emit('user_joined', {
          userId: socket.userId,
          role: socket.userRole,
        });
      } catch (error) {
        console.error('Join consultation error:', error);
        socket.emit('error', { message: 'Failed to join consultation' });
      }
    });

    // ========================================
    // Send Message
    // ========================================
    socket.on('send_message', async ({ consultationId, text }) => {
      try {
        if (!consultationId || !text || !text.trim()) {
          socket.emit('error', { message: 'Invalid message' });
          return;
        }

        const consultation = await Consultation.findById(consultationId)
          .populate('farmerId', 'name email')
          .populate('agronomistId', 'name email');

        if (!consultation) {
          socket.emit('error', { message: 'Consultation not found' });
          return;
        }

        // Create message
        const message = new Message({
          consultationId,
          senderId: socket.userId,
          text: text.trim(),
          senderRole: socket.userRole,
        });

        await message.save();
        await message.populate('senderId', 'name role');

        // Update consultation last message time
        consultation.lastMessageTime = new Date();
        await consultation.save();

        // Broadcast message to room
        io.to(`consultation_${consultationId}`).emit('new_message', {
          _id: message._id,
          text: message.text,
          sender: socket.userRole === 'farmer' ? 'farmer' : 'agronomist',
          senderId: message.senderId,
          createdAt: message.createdAt,
        });

        // Send email notification to other party
        const recipient =
          socket.userRole === 'farmer'
            ? consultation.agronomistId
            : consultation.farmerId;

        if (recipient) {
          await sendEmail({
            to: recipient.email,
            subject: 'New Message in Your Consultation',
            template: 'new-message',
            data: {
              recipientName: recipient.name,
              senderName: socket.userRole === 'farmer' ? 'Farmer' : 'Agronomist',
              messageText: text.substring(0, 100),
              consultationId,
            },
          });
        }
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // ========================================
    // Typing Indicator
    // ========================================
    socket.on('typing_start', ({ consultationId }) => {
      socket.to(`consultation_${consultationId}`).emit('user_typing', {
        userId: socket.userId,
        role: socket.userRole,
      });
    });

    socket.on('typing_stop', ({ consultationId }) => {
      socket.to(`consultation_${consultationId}`).emit('user_stopped_typing', {
        userId: socket.userId,
      });
    });

    // ========================================
    // Mark Messages as Read
    // ========================================
    socket.on('mark_read', async ({ consultationId }) => {
      try {
        await Message.updateMany(
          {
            consultationId,
            senderId: { $ne: socket.userId },
            isRead: false,
          },
          { isRead: true, readAt: new Date() }
        );

        socket.to(`consultation_${consultationId}`).emit('messages_read', {
          userId: socket.userId,
        });
      } catch (error) {
        console.error('Mark read error:', error);
      }
    });

    // ========================================
    // Disconnect
    // ========================================
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
      if (socket.consultationId) {
        socket
          .to(`consultation_${socket.consultationId}`)
          .emit('user_left', {
            userId: socket.userId,
          });
      }
    });

    // ========================================
    // Error Handling
    // ========================================
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  return io;
}

// ========================================
// Send Notification to Specific User
// ========================================
function sendNotificationToUser(userId, event, data) {
  if (!io) {
    console.error('Socket.io not initialized');
    return;
  }

  // Find all sockets for this user
  const sockets = Array.from(io.sockets.sockets.values());
  const userSockets = sockets.filter((s) => s.userId === userId);

  userSockets.forEach((socket) => {
    socket.emit(event, data);
  });
}

// ========================================
// Send Notification to Consultation Room
// ========================================
function sendNotificationToConsultation(consultationId, event, data) {
  if (!io) {
    console.error('Socket.io not initialized');
    return;
  }

  io.to(`consultation_${consultationId}`).emit(event, data);
}

module.exports = {
  initializeSocket,
  sendNotificationToUser,
  sendNotificationToConsultation,
};
