import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET() {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('restaurant_tables')
        .select('id, capacity_min, capacity_max')
        .order('id');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}
