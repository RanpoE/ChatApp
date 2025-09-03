import express, { Request, Response } from 'express';
import cors from 'cors';

// Routes here
import authRoutes from './routes/auth';
import convRoutes from './routes/conversations'
import msgRoutes from './routes/messages'
import { requireAuth } from './middleware/requireAuth';


const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3001;

// Middleware
app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000' }));

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Public route
app.use('/auth', authRoutes);

// Protected Routes
app.use('/conversations', requireAuth, convRoutes)
app.use('/messages', requireAuth, msgRoutes)

// Root route
app.get('/', (_req: Request, res: Response) => {
  res.send('Hello from TypeScript + Express!');
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
