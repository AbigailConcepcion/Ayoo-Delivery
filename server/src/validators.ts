import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(6),
  preferredCity: z.string().optional(),
  role: z.string().optional(),
  merchantId: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const addressSchema = z.object({
  label: z.string().min(1),
  details: z.string().min(1),
  city: z.string().min(1)
});

export const paymentSchema = z.object({
  id: z.string().optional(),
  type: z.string(),
  last4: z.string().optional().nullable(),
  expiry: z.string().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  balance: z.number().nullable().optional()
});

export const orderSchema = z.object({
  id: z.string().optional(),
  date: z.string(),
  items: z.array(z.any()),
  total: z.number(),
  status: z.string(),
  restaurantName: z.string(),
  customerEmail: z.string().email(),
  customerName: z.string(),
  deliveryAddress: z.string(),
  pointsEarned: z.number().optional()
});

export const topUpSchema = z.object({
  methodId: z.string(),
  amount: z.number().positive()
});

export const paymentProcessSchema = z.object({
  email: z.string().email(),
  methodId: z.string(),
  amount: z.number().positive(),
  orderId: z.string()
});

export const payOrderSchema = z.object({
  method: z.string(),
  transactionId: z.string().optional()
});
