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

import { testConnection, initDB, pool } from './config/db';
import { sendMessagePushNotification } from './utils/notificationHelper';

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

app.use(cors());
app.use(express.json());
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

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

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
      fileName = null 
    } = data;

    try {
      console.log('[Debug Backend] 3. Încercare de salvare în DB...');
      
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

      sendMessagePushNotification(senderId, receiverId, notificationText).catch((err) => console.error(err));
    } catch (error) {
      console.error('[Debug Backend - EROARE CRITICĂ] Nu s-a putut salva mesajul:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Sockets] Client deconectat: ${socket.id}`);
  });
});

const startServer = async () => {
  try {
    await testConnection();
    await initDB();

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
