import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
    try {
        const supabase = createAdminClient();
        const now = new Date().toISOString();

        // 1. Fetch pending checks
        const { data: checks, error } = await supabase
            .from('table_checks')
            .select(`
                *,
                dine_ins (*),
                reservations (*)
            `)
            .is('response', null)
            .lte('prompted_at', now);

        if (error) throw error;

        return NextResponse.json(checks);
    } catch (error) {
        console.error('Pending checks error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
