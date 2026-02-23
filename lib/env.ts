const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'SMTP_HOST',
    'SMTP_PORT',
    'CRON_SECRET'
];

export function validateEnv() {
    const missing = requiredEnvVars.filter(v => !process.env[v]);

    if (missing.length > 0 && process.env.NODE_ENV === 'production') {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    } else if (missing.length > 0) {
        console.warn(`[DIBA] Missing environment variables: ${missing.join(', ')}`);
    }
}
