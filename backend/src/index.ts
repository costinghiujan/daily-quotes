import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import http from 'http';
import { Server } from 'socket.io';

import quoteRoutes from './routes/quoteRoutes';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import friendshipRoutes from './routes/friendshipRoutes';
import sessionRoutes from './routes/sessionRoutes';
import notificationRoutes from './routes/notificationRoutes';
import messageRoutes from './routes/messageRoutes';
import scheduledNotificationRoutes from './routes/scheduledNotificationRoutes';

import { testConnection, initDB, pool } from './config/db';
import { sendMessagePushNotification } from './utils/notificationHelper';
import { initCronJobs } from './services/cronService';
import { validateEnvironment } from './utils/envValidator';
import { applySecurityMiddleware } from './middleware/securityMiddleware';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Security middleware
applySecurityMiddleware(app);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Bine ai venit la API-ul pentru aplicația de citate!',
    healthCheck: '/api/health',
  });
});

app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'success', message: 'Serverul funcționează corect!' });
});

app.use('/api/notifications', notificationRoutes);
app.use('/api/friendships', friendshipRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/scheduled-notifications', scheduledNotificationRoutes);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Track active calls: callerId -> calleeId
const activeCalls = new Map<number, number>();

io.on('connection', (socket) => {
  console.log(`[Sockets] Un client s-a conectat: ${socket.id}`);

  socket.on('join_own_room', (userId) => {
    socket.join(`room_${userId}`);
    console.log(`[Sockets] User-ul ${userId} a intrat în camera room_${userId}`);
  });

  socket.on('send_message', async (data) => {
    console.log('\n[Debug Backend] 1. Eveniment "send_message" PRIMIT!');
    console.log('[Debug Backend] 2. Date primite:', data);

    const {
      senderId,
      receiverId,
      text,
      messageType = 'TEXT',
      mediaUrl = null,
      fileName = null,
    } = data;

    try {
      const blockCheck = await pool.query(
        `SELECT 1 FROM blocks 
         WHERE (blocker_id = $1 AND blocked_id = $2) 
            OR (blocker_id = $2 AND blocked_id = $1)`,
        [senderId, receiverId],
      );

      if (blockCheck.rows.length > 0) {
        console.warn(
          `[Sockets] ⛔ Mesaj respins: Relație blocată între ${senderId} și ${receiverId}.`,
        );
        socket.emit('message_error', {
          message:
            'Nu poți trimite mesaje acestui utilizator deoarece există o restricție de blocare.',
        });
        return;
      }

      console.log('[Debug Backend] 3. Verificare trecură. Încercare de salvare în DB...');

      const result = await pool.query(
        `INSERT INTO messages 
        (sender_id, receiver_id, text, message_type, media_url, file_name) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING *`,
        [senderId, receiverId, text || null, messageType, mediaUrl, fileName],
      );

      const savedMessage = result.rows[0];
      console.log('[Debug Backend] 4. Salvat cu succes in DB:', savedMessage.id);

      io.to(`room_${receiverId}`).emit('receive_message', savedMessage);
      io.to(`room_${senderId}`).emit('receive_message', savedMessage);
      console.log(
        '[Debug Backend] 5. Ecou trimis înapoi către camerele',
        `room_${receiverId}`,
        'și',
        `room_${senderId}`,
      );

      let notificationText = text;
      if (!text || text.trim() === '') {
        if (messageType === 'IMAGE') notificationText = '📷 A trimis o fotografie';
        else if (messageType === 'DOCUMENT') notificationText = '📄 A trimis un document';
        else notificationText = 'A trimis un mesaj nou';
      }

      sendMessagePushNotification(senderId, receiverId, notificationText).catch((err) =>
        console.error(err),
      );
    } catch (error) {
      console.error('[Debug Backend - EROARE CRITICĂ] Nu s-a putut salva mesajul:', error);
    }
  });

  socket.on('messages_read', (data: { otherUserId: number; userId: number }) => {
    // Notify the current user's room so their ConversationsScreen updates immediately
    io.to(`room_${data.userId}`).emit('messages_read', { otherUserId: data.otherUserId });
    // Also notify the other user's room so their ConversationsScreen updates too
    io.to(`room_${data.otherUserId}`).emit('messages_read', { otherUserId: data.userId });
  });

  // ========== CALL SIGNALING EVENTS ==========

  socket.on('call_offer', (data: { to: number; offer: any; callerName: string; callerAvatar: string | null; isVideo: boolean }) => {
    const { to, offer, callerName, callerAvatar, isVideo } = data;
    console.log(`[Calls] Apel de la ${socket.id} către utilizatorul ${to}`);

    // Find the socket ID of the caller to get their user ID
    // We need to find which user ID is associated with this socket
    let callerId: number | null = null;
    for (const [roomName] of socket.rooms) {
      if (roomName.startsWith('room_')) {
        callerId = parseInt(roomName.replace('room_', ''), 10);
        break;
      }
    }

    if (!callerId) {
      console.log('[Calls] Nu s-a putut determina callerId');
      return;
    }

    // Check if the callee is already in a call
    const calleeInCall = Array.from(activeCalls.entries()).find(
      ([caller, callee]) => caller === to || callee === to
    );

    if (calleeInCall) {
      socket.emit('user_busy');
      return;
    }

    // Track the call: caller -> callee
    activeCalls.set(callerId, to);

    // Forward the offer to the callee
    io.to(`room_${to}`).emit('call_offer', {
      offer,
      callerName,
      callerAvatar,
      isVideo,
    });
  });

  socket.on('call_answer', (data: { to: number; answer: any }) => {
    const { to, answer } = data;
    console.log(`[Calls] Răspuns la apel către utilizatorul ${to}`);
    io.to(`room_${to}`).emit('call_answer', { answer });
  });

  socket.on('call_ice_candidate', (data: { to: number; candidate: any }) => {
    const { to, candidate } = data;
    io.to(`room_${to}`).emit('call_ice_candidate', { candidate });
  });

  socket.on('call_end', (data: { to: number }) => {
    const { to } = data;
    console.log(`[Calls] Apel încheiat, notific utilizatorul ${to}`);

    // Remove from active calls
    activeCalls.delete(to);

    io.to(`room_${to}`).emit('call_ended');
  });

  socket.on('call_decline', (data: { to: number }) => {
    const { to } = data;
    console.log(`[Calls] Apel refuzat, notific utilizatorul ${to}`);

    // Remove from active calls
    activeCalls.delete(to);

    io.to(`room_${to}`).emit('call_declined');
  });

  socket.on('disconnect', () => {
    console.log(`[Sockets] Client deconectat: ${socket.id}`);

    // Clean up any active calls for this user
    const socketRooms = Array.from(socket.rooms);
    for (const room of socketRooms) {
      if (room.startsWith('room_')) {
        const userId = parseInt(room.replace('room_', ''), 10);
        activeCalls.delete(userId);
      }
    }
  });
});

const startServer = async () => {
  try {
    if (!validateEnvironment()) {
      console.error('[Eroare Critică] Validarea variabilelor de mediu a eșuat.');
      process.exit(1);
    }

    await testConnection();
    await initDB();

    initCronJobs();

    server
      .listen(PORT, () => {
        console.log(`[Server] Pornește pe portul ${PORT} (Express + WebSockets)`);
      })
      .on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          console.error(
            `[Eroare] Portul ${PORT} este ocupat. Te rugăm să eliberezi portul sau să folosești altul.`,
          );
        } else {
          console.error(err);
        }
      });
  } catch (error) {
    console.error('[Eroare Critică] Nu s-a putut porni serverul din cauza bazei de date:', error);
    process.exit(1);
  }
};

startServer();
