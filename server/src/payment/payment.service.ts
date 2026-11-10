import Stripe from "stripe";
import crypto from "crypto";
import prisma from "../lip/prisma";
import { paymentRepository } from "./payment.repository";
import { PaymentMethod, PaymentStatus } from "./payment.types";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_missing_key");
const transactionId = () => `txn_${crypto.randomUUID().replace(/-/g, "")}`;

const ownedOrder = async (orderId: string, userId: string) => {
  const order = await prisma.order.findFirst({ where: { id: orderId, userId } });
  if (!order) throw new Error("Order not found");
  return order;
};

export const paymentService = {
  async createIntent(input: { orderId: string; paymentMethod?: PaymentMethod; description?: string }, userId: string) {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error("Stripe is not configured");
    const order = await ownedOrder(input.orderId, userId);
    if (order.paymentStatus === "PAID") throw new Error("This order has already been paid");
    const existing = await prisma.payment.findFirst({ where: { orderId: order.id, status: PaymentStatus.PENDING } });
    if (existing?.paymentIntentId) {
      const intent = await stripe.paymentIntents.retrieve(existing.paymentIntentId);
      return { payment: existing, clientSecret: intent.client_secret };
    }
    const intent = await stripe.paymentIntents.create({ amount: Math.round(order.totalAmount * 100), currency: "usd", metadata: { orderId: order.id, userId }, description: input.description });
    const payment = await paymentRepository.create({ userId, orderId: order.id, amount: order.totalAmount, paymentMethod: input.paymentMethod ?? PaymentMethod.STRIPE, description: input.description, paymentIntentId: intent.id });
    return { payment, clientSecret: intent.client_secret };
  },
  async verifyIntent(paymentIntentId: string, userId?: string) {
    const payment = await paymentRepository.findByIntent(paymentIntentId);
    if (!payment || (userId && payment.userId !== userId)) throw new Error("Payment not found");
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (intent.status !== "succeeded") return { payment, verified: false, status: intent.status };
    const settled = await this.markPaid(payment.id);
    return { payment: settled, verified: true, status: intent.status };
  },
  async markPaid(id: string) {
    const payment = await paymentRepository.findById(id);
    if (!payment) throw new Error("Payment not found");
    if (payment.status === PaymentStatus.PAID) return payment;
    return prisma.$transaction(async (tx) => {
      const items = Array.isArray(payment.order.items) ? payment.order.items as unknown as { productId?: string; quantity?: number }[] : [];
      for (const item of items) {
        if (!item.productId || !item.quantity) continue;
        const decreased = await tx.product.updateMany({ where: { id: item.productId, quantity: { gte: Number(item.quantity) } }, data: { quantity: { decrement: Number(item.quantity) } } });
        if (decreased.count !== 1) throw new Error("Stock changed before payment could be completed");
        const product = await tx.product.findUnique({ where: { id: item.productId }, select: { quantity: true } });
        if (product && product.quantity <= 0) await tx.product.update({ where: { id: item.productId }, data: { status: "OUT_OF_STOCK" } });
      }
      const updated = await tx.payment.update({ where: { id }, data: { status: PaymentStatus.PAID, transactionId: transactionId(), paidAt: new Date() } });
      await tx.order.update({ where: { id: payment.orderId }, data: { ispaid: true, status: "PAID", paymentStatus: "PAID" } });
      return updated;
    });
  },
  async refund(id: string) {
    const payment = await paymentRepository.findById(id);
    if (!payment) throw new Error("Payment not found");
    if (payment.status !== PaymentStatus.PAID || !payment.paymentIntentId) throw new Error("Only paid Stripe payments can be refunded");
    await stripe.refunds.create({ payment_intent: payment.paymentIntentId });
    return prisma.$transaction(async (tx) => {
      const updated = await tx.payment.update({ where: { id }, data: { status: PaymentStatus.REFUNDED } });
      await tx.order.update({ where: { id: payment.orderId }, data: { ispaid: false, status: "REFUNDED", paymentStatus: "REFUNDED" } });
      return updated;
    });
  },
  async checkoutSession(input: { orderId: string }, userId: string, origin: string) {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error("Stripe is not configured");
    const order = await ownedOrder(input.orderId, userId);
    if (order.paymentStatus === "PAID") throw new Error("This order has already been paid");
    const session = await stripe.checkout.sessions.create({ mode: "payment", client_reference_id: order.id, metadata: { orderId: order.id, userId }, line_items: [{ price_data: { currency: "usd", product_data: { name: `Order ${order.id}` }, unit_amount: Math.round(order.totalAmount * 100) }, quantity: 1 }], success_url: `${origin}/payment?success=1&session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${origin}/payment?cancelled=1` });
    const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
    if (!paymentIntentId) throw new Error("Stripe payment intent was not created");
    await paymentRepository.create({ userId, orderId: order.id, amount: order.totalAmount, paymentMethod: PaymentMethod.STRIPE, paymentIntentId });
    return session;
  },
  async verifyCheckoutSession(sessionId: string, userId: string) {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error("Stripe is not configured");
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.metadata?.userId !== userId || !session.payment_intent) throw new Error("Checkout session not found");
    if (typeof session.payment_intent !== "string") throw new Error("Payment is still being prepared");
    return this.verifyIntent(session.payment_intent, userId);
  },
  async statistics() {
    const payments = await prisma.payment.findMany({ select: { amount: true, status: true } });
    return { total: payments.length, paid: payments.filter((p) => p.status === PaymentStatus.PAID).length, refunded: payments.filter((p) => p.status === PaymentStatus.REFUNDED).length, revenue: payments.filter((p) => p.status === PaymentStatus.PAID).reduce((sum, p) => sum + p.amount, 0) };
  },
};
