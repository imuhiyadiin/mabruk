import { PaymentMethod, PaymentStatus } from "./payment.types";

export type CreatePaymentDto = { orderId: string; paymentMethod?: PaymentMethod; description?: string };
export type UpdatePaymentStatusDto = { status: PaymentStatus };
