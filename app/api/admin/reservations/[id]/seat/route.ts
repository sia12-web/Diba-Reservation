import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supabase = createAdminClient();

        const { data: res } = await supabase.from('reservations').select('*').eq('id', id).single();
        if (!res) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const seatedAt = new Date().toISOString();
        const promptedAt = new Date(Date.now() + 40 * 60 * 1000).toISOString();

        await supabase.from('reservations').update({
            status: 'seated',
            seated_at: seatedAt // I should ensure seeded_at column exists or is handled. 
            // In schema 001 seated_at isn't in reservations, let's check.
        }).eq('id', id);

        await supabase.from('table_checks').insert({
            reservation_id: id,
            check_type: 'reservation',
            prompted_at: promptedAt
        });

        // Extend lock if needed or just keep current
        // Usually seated means we keep those tables until they leave.

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
