import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Bine ai venit la API-ul pentru aplicația de citate!',
    healthCheck: '/api/health'
  });
});

app.get('/api/health', (req: Request, res: Response) => {
  try {
    res.status(200).json({ 
      status: 'success', 
      message: 'Serverul funcționează corect!' 
    });
  } catch (error) {
    console.error('Eroare în ruta de health check:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Eroare internă a serverului.' 
    });
  }
});

const server = app.listen(PORT, () => {
  console.log(`[Server] API-ul rulează pe http://localhost:${PORT}`);
});

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.syscall !== 'listen') throw error;
  
  if (error.code === 'EADDRINUSE') {
    console.error(`[Eroare] Portul ${PORT} este deja folosit de altă aplicație.`);
    process.exit(1);
  } else {
    throw error;
  }
});