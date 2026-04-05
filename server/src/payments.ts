import Stripe from 'stripe';

const stripeSecret = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET || '';

export const stripe = new Stripe(stripeSecret, {
  apiVersion: '2022-11-15'
});

/**
 * Creates a PaymentIntent which is the recommended way to handle payments with Stripe.
 * This supports SCA/3D Secure.
 */
export async function createStripePaymentIntent(amount: number, currency = 'php', orderId: string, idempotencyKey?: string) {
  return stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Stripe expects amount in smallest unit (cents/centavos)
    currency,
    metadata: { orderId },
    automatic_payment_methods: { enabled: true }
  }, { idempotencyKey });
}
