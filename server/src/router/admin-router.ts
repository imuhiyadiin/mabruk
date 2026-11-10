import { Router } from "express";
import { adminStats, createAdminCategory, createAdminUser, deleteAdminCategory, deleteAdminOrder, deleteAdminUser, getAdminCategories, getAdminOrders, getAdminUser, getAdminUsers, updateAdminCategory, updateAdminOrder, updateAdminUser, updateAdminUserPermissions } from "../controller/admin-controller";
import { requirePermission, verifyToken } from "../midlewhere/auth";

const router = Router();

router.use(verifyToken);
router.get("/stats", requirePermission("dashboard.view", "analytics.view"), adminStats);
router.get("/users", requirePermission("users.view", "users.manage"), getAdminUsers);
router.post("/users", requirePermission("users.manage"), createAdminUser);
router.get("/users/:id", requirePermission("users.view", "users.manage"), getAdminUser);
router.patch("/users/:id/permissions", requirePermission("users.manage"), updateAdminUserPermissions);
router.patch("/users/:id", requirePermission("users.manage"), updateAdminUser);
router.delete("/users/:id", requirePermission("users.manage"), deleteAdminUser);
router.get("/categories", requirePermission("categories.view", "categories.create", "categories.edit", "categories.delete"), getAdminCategories);
router.post("/categories", requirePermission("categories.create"), createAdminCategory);
router.patch("/categories/:id", requirePermission("categories.edit"), updateAdminCategory);
router.delete("/categories/:id", requirePermission("categories.delete"), deleteAdminCategory);
router.get("/orders", requirePermission("orders.view", "orders.update", "orders.delete"), getAdminOrders);
router.patch("/orders/:id", requirePermission("orders.update"), updateAdminOrder);
router.delete("/orders/:id", requirePermission("orders.delete"), deleteAdminOrder);

export default router;
