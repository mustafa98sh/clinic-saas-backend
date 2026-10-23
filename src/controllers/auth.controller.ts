import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// ربط Supabase باستخدام المفاتيح الموجودة في ملف .env
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export const loginClinic = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // محاولة تسجيل الدخول عبر Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        // إذا وُجد خطأ (كلمة المرور غلط أو اليوزر غير موجود)
        if (error) {
            return res.status(400).json({
                success: false,
                error: 'اسم المستخدم أو كلمة المرور غير صحيحة',
            });
        }

        // إذا كانت البيانات صحيحة تماماً
        res.status(200).json({
            success: true,
            message: 'تم تسجيل الدخول بنجاح',
            session: data.session,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};