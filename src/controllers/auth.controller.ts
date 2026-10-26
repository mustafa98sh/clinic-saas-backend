import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { Request, Response } from 'express';
import { clinicProblem, findClinicForUser } from '../auth.middleware';


dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_ANON_KEY || '',
);

export const loginClinic = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error || !data.session || !data.user) {
            return res.status(400).json({
                success: false,
                error: 'اسم المستخدم أو كلمة المرور غير صحيحة',
            });
        }

        // العيادة المرتبطة بهذا المستخدم
        const clinic = await findClinicForUser(data.user.id);
        if (!clinic) {
            return res.status(403).json({
                success: false,
                error: 'حسابك غير مرتبط بأي عيادة',
            });
        }

        const problem = clinicProblem(clinic);
        if (problem) {
            return res.status(403).json({ success: false, error: problem });
        }

        res.status(200).json({
            success: true,
            message: 'تم تسجيل الدخول بنجاح',
            session: data.session,
            clinic: { id: clinic.id, name: clinic.name },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};