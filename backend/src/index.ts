import express, { Request, Response } from 'express';
import cors from 'cors';
import quoteRoutes from './routes/quoteRoutes';
import { testConnection, initDB } from './config/db';
import { hostname } from 'node:os';

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

app.use('/api/quotes', quoteRoutes);

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