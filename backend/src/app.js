import express from 'express';
import cors from 'cors';
import path from 'path';
import storyRoutes from './routes/storyRoutes.js';
import { notFoundHandler, errorHandler } from './utils/errorHandlers.js';

const app = express();
const publicDir = path.resolve('public');

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/audio', express.static(path.join(publicDir, 'audio')));
app.use('/images', express.static(path.join(publicDir, 'images')));

app.use('/api/story', storyRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
