import { PaymentMethod, PaymentStatus } from "./payment.types";

export const validateCreatePayment = (body: unknown) => {
  const value = body as { orderId?: unknown; paymentMethod?: unknown; description?: unknown };
  if (!value?.orderId || typeof value.orderId !== "string") throw new Error("A valid orderId is required");
  if (value.paymentMethod && !Object.values(PaymentMethod).includes(value.paymentMethod as PaymentMethod)) throw new Error("Invalid payment method");
  if (value.description && typeof value.description !== "string") throw new Error("Description must be text");
  return value as { orderId: string; paymentMethod?: PaymentMethod; description?: string };
};

export const validateStatus = (body: unknown) => {
  const status = (body as { status?: unknown })?.status;
  if (!status || !Object.values(PaymentStatus).includes(status as PaymentStatus)) throw new Error("Invalid payment status");
  return status as PaymentStatus;
};
