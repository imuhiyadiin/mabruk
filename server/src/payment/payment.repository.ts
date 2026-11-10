import prisma from "../lip/prisma";
import { PaymentMethod, PaymentStatus } from "./payment.types";

export const paymentRepository = {
  create: (data: { userId: string; orderId: string; amount: number; paymentMethod: PaymentMethod; description?: string; paymentIntentId?: string }) => prisma.payment.create({ data }),
  findById: (id: string) => prisma.payment.findUnique({ where: { id }, include: { order: true } }),
  findByIntent: (paymentIntentId: string) => prisma.payment.findUnique({ where: { paymentIntentId }, include: { order: true } }),
  findAll: () => prisma.payment.findMany({ include: { user: { select: { id: true, fullname: true, email: true } }, order: true }, orderBy: { createdAt: "desc" } }),
  findByUser: (userId: string) => prisma.payment.findMany({ where: { userId }, include: { order: true }, orderBy: { createdAt: "desc" } }),
  updateStatus: (id: string, status: PaymentStatus) => prisma.payment.update({ where: { id }, data: { status } }),
};
