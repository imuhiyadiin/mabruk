import { PaymentMethod, PaymentStatus } from "../generated/prisma/client";

export { PaymentMethod, PaymentStatus };

export type PaymentInput = {
  orderId: string;
  paymentMethod?: PaymentMethod;
  description?: string;
};
