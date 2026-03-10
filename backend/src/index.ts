import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import quoteRoutes from './routes/quoteRoutes';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import friendshipRoutes from './routes/friendshipRoutes';
import sessionRoutes from './routes/sessionRoutes';
import { testConnection, initDB } from './config/db';
import notificationRoutes from './routes/notificationRoutes';

const app = express();

const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Bine ai venit la API-ul pentru aplicația de citate!',
    healthCheck: '/api/health'
  });
});

app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'success', message: 'Serverul funcționează corect!' });
});

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/api/notifications', notificationRoutes);
app.use('/api/friendships', friendshipRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

const startServer = async () => {
  try {
    await testConnection();
    await initDB();

    app.listen(PORT, () => {
    }).on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`[Eroare] Portul ${PORT} este ocupat.`);
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