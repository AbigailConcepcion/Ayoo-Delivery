// small wrapper around a real payment gateway (Stripe in this example).
// the goal is to demonstrate wiring to a third‑party API; you can
// replace Stripe with whatever provider you prefer.

// we declare everything as `any` so that the workspace doesn't
// require installing stripe types during analysis.

declare const process: any;
declare module 'stripe';
const Stripe: any = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2020-08-27'
});

export async function chargeCard(token: string, amount: number, currency = 'php'): Promise<any> {
  // amount is in the smallest currency unit (centavos)
  const cents = Math.round(amount * 100);
  return stripe.charges.create({ amount: cents, currency, source: token });
}
