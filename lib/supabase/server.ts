import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const createClient = async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        return {
            auth: { getSession: () => Promise.resolve({ data: { session: null }, error: null }) },
            from: () => ({ select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null }) }) }) })
        } as any;
    }

    const cookieStore = await cookies();

    return createServerClient(url, key, {
        cookies: {
            get(name: string) {
                return cookieStore.get(name)?.value;
            },
            set(name: string, value: string, options: CookieOptions) {
                try {
                    cookieStore.set({ name, value, ...options });
                } catch (error) {
                    // Ignore component-level set errors
                }
            },
            remove(name: string, options: CookieOptions) {
                try {
                    cookieStore.set({ name, value: '', ...options });
                } catch (error) {
                    // Ignore component-level remove errors
                }
            },
        },
    });
};

export const createAdminClient = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        return {
            from: () => ({
                select: () => ({
                    eq: () => ({
                        maybeSingle: () => Promise.resolve({ data: null }),
                        single: () => Promise.resolve({ data: null }),
                        order: () => ({ range: () => Promise.resolve({ data: [], count: 0 }) })
                    })
                }),
                insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null }) }) }),
                update: () => ({ eq: () => Promise.resolve({ data: null }) }),
                delete: () => ({ in: () => Promise.resolve({ data: null }) })
            })
        } as any;
    }

    return createSupabaseClient(url, key);
};
