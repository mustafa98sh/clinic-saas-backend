import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// 1. مسار إضافة موعد جديد
router.post('/appointments', async (req, res) => {
    try {
        const { name, phone, appointment_time, type, status, clinicId } = req.body;

        // إنشاء مريض جديد أو ربطه
        const patient = await prisma.patient.create({
            data: {
                name,
                phone,
                clinicId: clinicId || 'default-clinic-id',
            },
        });

        // إنشاء الموعد المرتبط بالمريض
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

// 2. مسار جلب مواعيد اليوم
router.get('/appointments/today', async (req, res) => {
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

export default router;