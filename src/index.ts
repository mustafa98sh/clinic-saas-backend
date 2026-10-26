import { Patient } from '@prisma/client';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import prisma from './db';
import authRoutes from './routes/auth.routes';
import { requireAuth } from './auth.middleware ';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// مسار ترحيبي
app.get('/', (req, res) => {
    res.json({ success: true, message: 'Clinic SaaS Backend is running! 🚀' });
});

// مسارات المصادقة (عامة: تسجيل الدخول)
app.use('/api/auth', authRoutes);

// كل ما يخص المرضى والمواعيد محمي:
// requireAuth يتحقق من التوكن ويضع req.clinicId من عيادة المستخدم
app.use('/api/patients', requireAuth);

// ------------------------------------------------------------
// البحث عن مرضى مسجلين بنفس الاسم (داخل عيادة المستخدم فقط)
// GET /api/patients/search?name=...
// ------------------------------------------------------------
app.get('/api/patients/search', async (req, res) => {
    try {
        const clinicId = req.clinicId!;
        const q = String(req.query.name ?? '').trim();
        if (q.length < 2) {
            return res.json({ success: true, data: [] });
        }

        const patients = await prisma.patient.findMany({
            where: {
                clinicId,
                name: { contains: q, mode: 'insensitive' },
            },
            select: {
                id: true,
                name: true,
                phone: true,
                age: true,
                address: true,
                gender: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });

        res.json({ success: true, data: patients });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ------------------------------------------------------------
// حجز موعد: لمريض موجود (patientId) أو لمريض جديد
// POST /api/patients/appointments
// ------------------------------------------------------------
app.post('/api/patients/appointments', async (req, res) => {
    try {
        const clinicId = req.clinicId!; // من التوكن، وليس من جسم الطلب
        const { patientId, name, phone, age, address, gender, appointment_time, type, status } =
            req.body;

        let patient: Patient | null;

        if (patientId) {
            // مريض موجود: تأكد أنه يتبع عيادة المستخدم
            patient = await prisma.patient.findFirst({
                where: { id: patientId, clinicId },
            });
            if (!patient) {
                return res.status(404).json({ success: false, error: 'المريض غير موجود' });
            }
        } else {
            if (!name || !String(name).trim()) {
                return res.status(400).json({ success: false, error: 'اسم المريض مطلوب' });
            }

            const ageNum =
                age === undefined || age === null || age === '' ? null : parseInt(age, 10);

            patient = await prisma.patient.create({
                data: {
                    name: String(name).trim(),
                    phone: phone || null,
                    age: ageNum === null || Number.isNaN(ageNum) ? null : ageNum,
                    address: address || null,
                    gender: gender || null,
                    clinicId,
                },
            });
        }

        const appointment = await prisma.appointment.create({
            data: {
                patientId: patient.id,
                clinicId,
                state: status || 'PENDING',
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

// ------------------------------------------------------------
// مواعيد عيادة المستخدم
// GET /api/patients/appointments/today
// ------------------------------------------------------------
app.get('/api/patients/appointments/today', async (req, res) => {
    try {
        const appointments = await prisma.appointment.findMany({
            where: { clinicId: req.clinicId! },
            include: { patient: true },
            orderBy: { createdAt: 'desc' },
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