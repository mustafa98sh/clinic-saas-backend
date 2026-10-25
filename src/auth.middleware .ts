import { Clinic } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { NextFunction, Request, Response } from 'express';
import prisma from './db';


dotenv.config();

// نضيف حقلين لكائن الطلب ليستخدمهما أي مسار محمي
declare global {
    namespace Express {
        interface Request {
            userId?: string;
            clinicId?: string;
        }
    }
}

const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_ANON_KEY || '',
);

/** عيادة المستخدم (أول عيادة ينتمي إليها). */
export async function findClinicForUser(userId: string): Promise<Clinic | null> {
    const member = await prisma.clinicMember.findFirst({
        where: { userId },
        include: { clinic: true },
        orderBy: { createdAt: 'asc' },
    });
    return member?.clinic ?? null;
}

/** يرجع سبب منع العيادة (موقوفة/منتهية الاشتراك) أو null إن كانت سليمة. */
export function clinicProblem(clinic: Clinic): string | null {
    if (!clinic.isActive) return 'حساب العيادة موقوف';
    if (clinic.expiresAt && clinic.expiresAt < new Date()) return 'انتهى اشتراك العيادة';
    return null;
}

/**
 * يتحقق من توكن Supabase في ترويسة Authorization،
 * ويحدد العيادة من جدول ClinicMember. لا يثق بأي clinicId يأتي من التطبيق.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
    try {
        const header = req.headers.authorization ?? '';
        const token = header.startsWith('Bearer ') ? header.slice(7) : '';

        if (!token) {
            return res.status(401).json({ success: false, error: 'يلزم تسجيل الدخول' });
        }

        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data.user) {
            return res
                .status(401)
                .json({ success: false, error: 'انتهت الجلسة، سجّل الدخول مجدداً' });
        }

        const clinic = await findClinicForUser(data.user.id);
        if (!clinic) {
            return res
                .status(403)
                .json({ success: false, error: 'حسابك غير مرتبط بأي عيادة' });
        }

        const problem = clinicProblem(clinic);
        if (problem) {
            return res.status(403).json({ success: false, error: problem });
        }

        req.userId = data.user.id;
        req.clinicId = clinic.id;
        next();
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message });
    }
}