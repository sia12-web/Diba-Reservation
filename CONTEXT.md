# Diba Reservation System

## Stack
- Next.js 14 App Router, TypeScript, Tailwind
- Supabase (Postgres + Realtime + Auth)
- Stripe (test mode), MailHog (local email)

## Status: Phase 1 in progress

## Table Config
- Regular (1-4): 1,2,3,5,7,8,10,12,14
- Round (5-7): 4,6 — never combinable
- Large: 9 (6-12), 11 (8-14), 13 (6-12)
- Isolated (no combo): 4,5,6
- Combo-critical bridges: 10 (links 9↔11), 12 (links 11↔13)

## Valid Combos (adjacency-enforced)
[1,2],[2,3],[1,2,3]
[7,8],[8,9],[7,8,9]
[9,10],[10,11],[9,10,11]
[11,12],[12,13],[11,12,13]
[13,14]
[9,10,11,12],[10,11,12,13],[9,10,11,12,13]
[7,8,9,10,11],[7,8,9,10,11,12,13],[7,8,9,10,11,12,13,14]

## Reallocation Rule
Tables 10 and 12 are combo-critical. Assign small parties to them only as last resort. If occupied and needed for a combo, flag for admin reallocation.

## Opening Hours
Mon-Thu, Sun: 11:30-22:00 (last slot 20:30)
Fri-Sat: 11:30-22:30 (last slot 21:00)
Slot interval: 30 min
Min dining buffer before close: 90 min
