import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.routes';

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// مسار ترحيبي
app.get('/', (req, res) => {
    res.json({ success: true, message: 'Clinic SaaS Backend is running! 🚀' });
});

// مسارات المصادقة
app.use('/api/auth', authRoutes);

// 1. مسار إضافة موعد جديد باستخدام Prisma
app.post('/api/patients/appointments', async (req, res) => {
    try {
        const { name, phone, appointment_time, type, status, clinicId } = req.body;

        const patient = await prisma.patient.create({
            data: {
                name,
                phone,
                clinicId: clinicId || '9aa6f17e-6202-439f-a666-9fca813c2c87',
            },
        });

        const appointment = await prisma.appointment.create({
            data: {
                patientId: patient.id,
                clinicId: patient.clinicId,
                state: status || 'PENDING',
            },
            include: {
                patient: true,
            },
        });

        res.status(201).json({
            success: true,
            data: {
                id: appointment.id,
                name: patient.name,
                phone: patient.phone,
                appointment_time: appointment_time || '05:00 م',
                type: type || 'كشف عام',
                status: appointment.state,
            },
        });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 2. مسار جلب مواعيد اليوم باستخدام Prisma
app.get('/api/patients/appointments/today', async (req, res) => {
    try {
        const appointments = await prisma.appointment.findMany({
            include: {
                patient: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        const formattedData = appointments.map((app) => ({
            id: app.id,
            name: app.patient.name,
            phone: app.patient.phone,
            appointment_time: '05:00 م',
            type: 'كشف عام',
            status: app.state === 'PENDING' ? 'في الانتظار' : app.state,
        }));

        res.status(200).json({ success: true, data: formattedData });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});