import { Voucher } from '../../types';

export interface CheckoutBreakdown {
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  tax: number;
  discount: number;
  total: number;
}

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function calculateCheckoutBreakdown(
  subtotal: number,
  deliveryFee: number,
  voucher: Voucher | null | undefined
): CheckoutBreakdown {
  const safeSubtotal = Math.max(0, roundMoney(subtotal));
  const safeDeliveryFee = Math.max(0, roundMoney(deliveryFee));
  const serviceFee = roundMoney(safeSubtotal * 0.025);
  const tax = roundMoney((safeSubtotal + serviceFee) * 0.12);
  const gross = roundMoney(safeSubtotal + safeDeliveryFee + serviceFee + tax);

  const voucherDiscount = voucher
    ? (voucher.type === 'percent'
      ? (safeSubtotal * voucher.discount / 100)
      : voucher.discount)
    : 0;
  const discount = Math.min(gross, Math.max(0, roundMoney(voucherDiscount)));
  const total = Math.max(0, roundMoney(gross - discount));

  return {
    subtotal: safeSubtotal,
    deliveryFee: safeDeliveryFee,
    serviceFee,
    tax,
    discount,
    total
  };
}
