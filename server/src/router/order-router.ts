import { Router } from "express";
import { verifyToken } from "../midlewhere/auth";
import { createOrder, getUserOrders } from "../controller/order-controller";

const router = Router()

router.post('/',verifyToken,createOrder)
router.get('/',verifyToken,getUserOrders)

export default router