import { Router } from "express";
import { createCategory, deleteCategory, getCategories, getCategory, updateCategory } from "../controller/category-controller";
import { requirePermission, verifyToken } from "../midlewhere/auth";
const router = Router()

router.post('/',verifyToken,requirePermission("categories.create"),createCategory)
router.get('/',getCategories)
router.get('/:name',getCategory)
router.patch('/:name',verifyToken,requirePermission("categories.edit"),updateCategory)
router.delete('/:name',verifyToken,requirePermission("categories.delete"),deleteCategory)

export default router
