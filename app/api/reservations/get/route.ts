import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) {
        return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    return NextResponse.json(data);
}
