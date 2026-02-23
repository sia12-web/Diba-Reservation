import { z } from 'zod';

export const reservationSchema = z.object({
    customerName: z.string().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    partySize: z.number().int().min(1, "Party size must be at least 1").max(38, "For parties over 38, please call us"),
    date: z.string().refine(d => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return new Date(d) >= today;
    }, "Date cannot be in the past"),
    time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
    notes: z.string().optional(),
    isAdmin: z.boolean().optional(),
    waiveDeposit: z.boolean().optional(),
    tableIds: z.array(z.number()).optional()
});

export type ReservationFormData = z.infer<typeof reservationSchema>;
