import { Router } from "express";
import { requireAdmin, verifyToken } from "../midlewhere/auth";
import { createCheckoutSession, createPaymentIntent, deletePayment, getMyPayments, getPayment, getPayments, paymentStatistics, refundPayment, updatePaymentStatus, verifyCheckoutSession, verifyPayment } from "./payment.controller";

const router = Router();
router.post("/intent", verifyToken, createPaymentIntent);
router.post("/checkout-session", verifyToken, createCheckoutSession);
router.post("/checkout-session/verify", verifyToken, verifyCheckoutSession);
router.get("/verify/:paymentIntentId", verifyToken, verifyPayment);
router.get("/me", verifyToken, getMyPayments);
router.get("/statistics", verifyToken, requireAdmin, paymentStatistics);
router.get("/", verifyToken, requireAdmin, getPayments);
router.get("/:id", verifyToken, getPayment);
router.patch("/:id/status", verifyToken, requireAdmin, updatePaymentStatus);
router.post("/:id/refund", verifyToken, requireAdmin, refundPayment);
router.delete("/:id", verifyToken, requireAdmin, deletePayment);
export default router;
