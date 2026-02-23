import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const date = searchParams.get('date');
        const status = searchParams.get('status');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = 20;
        const offset = (page - 1) * limit;

        const supabase = createAdminClient();

        let query = supabase
            .from('reservations')
            .select('*', { count: 'exact' });

        if (date) query = query.eq('reservation_date', date);
        if (status && status !== 'all') query = query.eq('status', status);

        const { data, count, error } = await query
            .order('reservation_date', { ascending: false })
            .order('reservation_time', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        return NextResponse.json({
            reservations: data,
            total: count,
            page,
            limit
        });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
