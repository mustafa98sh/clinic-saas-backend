import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import authRoutes from './routes/auth.routes';
import patientRoutes from './routes/patient.routes';

// 1. تحميل متغيرات البيئة في البداية أولاً
dotenv.config();

// 2. إنشاء كائن Supabase بعد تحميل متغيرات البيئة
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
export const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// مسار ترحيبي
app.get('/', (req, res) => {
    res.json({ success: true, message: 'Clinic SaaS Backend is running! 🚀' });
});

// ربط مسارات المصادقة
app.use('/api/auth', authRoutes);

// مسار إضافة موعد جديد
app.post('/api/patients/appointments', async (req, res) => {
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

        res.status(201).json({ success: true, data: data[0] });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// مسار جلب مواعيد اليوم
app.get('/api/patients/appointments/today', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('patients')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            return res.status(400).json({ success: false, error: error.message });
        }

        res.status(200).json({ success: true, data });
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
});
app.use('/api/patients', patientRoutes);
// تشغيل السيرفر بعد تسجيل كافة المسارات
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});