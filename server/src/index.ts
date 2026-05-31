import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRoutes from './routes/health.routes';
import usersRoutes from './routes/users.routes';
import businessesRoutes from './routes/businesses.routes';
import { errorHandler } from './middleware/error.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', healthRoutes);
app.use('/api', usersRoutes);
app.use('/api', businessesRoutes);

app.get('/', (_req, res) => {
  res.json({ message: 'FoodiFirm API Server', version: '1.0.0' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

export default app;
