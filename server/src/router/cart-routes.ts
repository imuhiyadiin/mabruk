import { Router } from "express";
import { verifyToken } from "../midlewhere/auth";
import { addCart, deleteCartItem, userCart } from "../controller/cart-controller";

const router = Router();

router.post("/", verifyToken, addCart);
router.get("/", verifyToken, userCart);
router.delete('/',verifyToken,deleteCartItem)

export default router;