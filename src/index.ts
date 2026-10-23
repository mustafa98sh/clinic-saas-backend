import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// مسار ترحيبي
app.get('/', (req, res) => {
    res.json({ success: true, message: 'Clinic SaaS Backend is running! 🚀' });
});

// ربط مسارات المصادقة تحت بادئة /api/auth
app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});