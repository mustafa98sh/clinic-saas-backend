import { Router } from 'express';
import { supabase } from '../index'; // أو '../db' حسب المكان الذي تصدر منه supabase

const router = Router();

// إضافة موعد جديد
router.post('/appointments', async (req, res) => {
    try {
        const { name, phone, appointment_time, type, status } = req.body;

        const { data, error } = await supabase
            .from('patients')
            .insert([
                {
                    name,
                    phone,
                    appointment_time,
                    type,
                    status: status || 'في الانتظار',
                },
            ])
            .select();

        if (error) {
            return res.status(400).json({ success: false, error: error.message });
        }

        res.status(201).json({
            success: true,
            message: 'تم إضافة الموعد بنجاح',
            data: data[0],
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// جلب مواعيد اليوم
router.get('/appointments/today', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('patients')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            return res.status(400).json({ success: false, error: error.message });
        }

        res.status(200).json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;