# Diba Reservation System — Deployment Guide

## Pre-deploy
- [ ] **Create Supabase project**: 
    - Run all 3 migrations in `supabase/migrations/` (001, 002, 003).
    - Run `supabase/seed.sql` to populate initial floor plan and settings.
- [ ] **Auth Setup**: Create at least one admin user in the Supabase Dashboard > Auth > Users.
- [ ] **Stripe Setup**: 
    - Create a Stripe account.
    - Get Secret Key and Publishable Key.
    - Configure a Webhook endpoint: `https://yourdomain.com/api/payments/webhook` listening for `checkout.session.completed`.
- [ ] **Email Setup**: 
    - Replace local MailHog settings with a production provider like **Resend**.
    - `SMTP_HOST=smtp.resend.com`
    - `SMTP_PORT=465`
    - `SMTP_USER=resend`
    - `SMTP_PASS=your_api_key`
- [ ] **Cron Secret**: Generate a random secure string for `CRON_SECRET`.

## Vercel Setup
- Connect your GitHub repository.
- Framework: Next.js.
- **Environment Variables**: Add all variables from `.env.local.example` to the Vercel project settings.
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - `SUPABASE_SERVICE_ROLE_KEY`
    - `STRIPE_SECRET_KEY`
    - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
    - `STRIPE_WEBHOOK_SECRET`
    - `SMTP_HOST`
    - `SMTP_PORT`
    - `CRON_SECRET`

## Post-deploy
- [ ] **Manually trigger CRONs**: Test the cron endpoints via `curl` adding the `Authorization` header.
- [ ] **End-to-End Test**:
    - Perform a customer reservation with a Stripe test card.
    - Check if a confirmation email is received.
    - log in as admin and verify the reservation appears in the dashboard.
    - Verify Floor Map reflects the occupancy.
- [ ] **Table Checks**: Ensure the 5-minute cron for table checks is firing.

## Maintenance
- The system automatically sends review requests 2 hours after guests are marked as "Left" or based on their seating time.
- Automated reminders are sent at midnight for reservations scheduled for the following day.
