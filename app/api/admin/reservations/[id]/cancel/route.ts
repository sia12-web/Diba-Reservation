import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supabase = createAdminClient();

        const { data: res } = await supabase.from('reservations').select('table_ids').eq('id', id).single();
        if (!res) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        // Update status
        await supabase.from('reservations').update({ status: 'cancelled' }).eq('id', id);

        // Release locks
        await supabase.from('table_locks').delete().in('table_id', res.table_ids);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
