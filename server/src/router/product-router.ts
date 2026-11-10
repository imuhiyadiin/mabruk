import { Router } from "express";
import { requirePermission, verifyToken } from "../midlewhere/auth";
import { createProduct, deleteProduct, getProduct, getProducts, updateProduct } from "../controller/product-controller";

const router = Router()

router.post('/',verifyToken,requirePermission("products.create"),createProduct)
router.get('/',getProducts)
router.patch('/:slug',verifyToken,requirePermission("products.edit"),updateProduct)
router.delete('/:slug',verifyToken,requirePermission("products.delete"),deleteProduct)
router.get('/:slug',getProduct)

export default router
