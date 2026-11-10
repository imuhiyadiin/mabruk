import hashpass from "bcryptjs";
import { Response } from "express";
import prisma from "../lip/prisma";
import { AuthRequest } from "../midlewhere/auth";

const userSelect = {
  id: true,
  fullname: true,
  email: true,
  role: true,
  permissions: true,
  createdAt: true,
  updatedAt: true,
};

const validUserPermissions = new Set([
  "dashboard.view", "analytics.view", "products.view", "products.create", "products.edit", "products.delete",
  "categories.view", "categories.create", "categories.edit", "categories.delete", "orders.view", "orders.update",
  "orders.delete", "customers.view", "users.view", "users.manage", "settings.manage",
]);

function academicYearRange(value: unknown) {
  if (typeof value !== "string") return undefined;
  const match = /^(\d{4})\s*\/\s*(\d{4})$/.exec(value);
  if (!match) return undefined;
  const startYear = Number(match[1]);
  const endYear = Number(match[2]);
  if (endYear !== startYear + 1) return undefined;
  return { gte: new Date(Date.UTC(startYear, 8, 1)), lt: new Date(Date.UTC(endYear, 8, 1)) };
}

export const adminStats = async (req: AuthRequest, res: Response) => {
  try {
    const academicRange = academicYearRange(req.query.academicYear);
    const orderPeriod = academicRange ? { createdAt: academicRange } : {};
    const userPeriod = academicRange ? { createdAt: academicRange } : {};
    const productPeriod = academicRange ? { createdAt: academicRange } : {};
    const categoryPeriod = academicRange ? { createdAt: academicRange } : {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrderCount = !academicRange || (today >= academicRange.gte && today < academicRange.lt)
      ? prisma.order.count({ where: { ...orderPeriod, createdAt: academicRange ? { gte: today, lt: academicRange.lt } : { gte: today } } })
      : Promise.resolve(0);
    const [totalUsers, totalProducts, totalOrders, pendingOrders, completedOrders, cancelledOrders, todayOrders, totalCategories, activeCategories, inactiveCategories, recentCategories, revenue, recentUsers, recentOrders, paidOrders] = await Promise.all([
      prisma.user.count({ where: userPeriod }),
      prisma.product.count({ where: productPeriod }),
      prisma.order.count({ where: orderPeriod }),
      prisma.order.count({ where: { ...orderPeriod, status: "PENDING" } }),
      prisma.order.count({ where: { ...orderPeriod, status: "COMPLETED" } }),
      prisma.order.count({ where: { ...orderPeriod, status: "CANCELLED" } }),
      todayOrderCount,
      prisma.category.count({ where: categoryPeriod }),
      prisma.category.count({ where: { ...categoryPeriod, isActive: true } }),
      prisma.category.count({ where: { ...categoryPeriod, isActive: false } }),
      prisma.category.findMany({ where: categoryPeriod, select: { id: true, name: true, slug: true, isActive: true, createdAt: true, _count: { select: { Product: true } } }, orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.order.aggregate({ where: { ...orderPeriod, ispaid: true }, _sum: { totalAmount: true } }),
      prisma.user.findMany({ where: userPeriod, select: userSelect, orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.order.findMany({ where: orderPeriod, orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.order.findMany({ where: { ...orderPeriod, ispaid: true }, select: { totalAmount: true, createdAt: true } }),
    ]);

    const weeklyRevenue = academicRange
      ? Array.from({ length: 12 }, (_, index) => {
        const date = new Date(Date.UTC(academicRange.gte.getUTCFullYear(), 8 + index, 1));
        const nextDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
        return {
          label: date.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
          total: paidOrders.filter((order) => order.createdAt >= date && order.createdAt < nextDate).reduce((sum, order) => sum + order.totalAmount, 0),
        };
      })
      : Array.from({ length: 7 }, (_, index) => {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - (6 - index));
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        return {
          label: date.toLocaleDateString("en-US", { weekday: "short" }),
          total: paidOrders.filter((order) => order.createdAt >= date && order.createdAt < nextDate).reduce((sum, order) => sum + order.totalAmount, 0),
        };
      });

    res.json({
      message: "admin statistics loaded",
      result: {
        totalUsers,
        totalProducts,
        totalOrders,
        pendingOrders,
        completedOrders,
        cancelledOrders,
        todayOrders,
        totalCategories,
        activeCategories,
        inactiveCategories,
        recentCategories,
        totalRevenue: revenue._sum.totalAmount ?? 0,
        recentUsers,
        recentOrders,
        weeklyRevenue,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "server error", error });
  }
};

export const getAdminUsers = async (req: AuthRequest, res: Response) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search : "";
    const role = req.query.role === "ADMIN" || req.query.role === "USER" ? req.query.role : undefined;
    const users = await prisma.user.findMany({
      where: {
        ...(role ? { role } : {}),
        ...(search ? { OR: [{ fullname: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }] } : {}),
      },
      select: userSelect,
      orderBy: { createdAt: "desc" },
    });
    res.json({ message: "users loaded", result: users });
  } catch (error) {
    res.status(500).json({ message: "server error", error });
  }
};

export const getAdminUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id as string }, select: userSelect });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "user loaded", result: user });
  } catch (error) {
    res.status(500).json({ message: "server error", error });
  }
};

export const updateAdminUserPermissions = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const permissions: unknown = req.body.permissions;
    if (!Array.isArray(permissions) || permissions.some((permission) => typeof permission !== "string" || !validUserPermissions.has(permission))) {
      return res.status(400).json({ message: "Invalid permission list" });
    }
    const existingUser = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!existingUser) return res.status(404).json({ message: "User not found" });
    const user = await prisma.user.update({ where: { id }, data: { permissions: permissions as string[] }, select: userSelect });
    res.json({ message: "user permissions updated", result: user });
  } catch (error) {
    res.status(500).json({ message: "server error", error });
  }
};

export const createAdminUser = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "complete name, email and password" });
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ message: "user email is already exist!.." });
    const user = await prisma.user.create({
      data: { fullname: name, email, password: hashpass.hashSync(password), role: role === "ADMIN" ? "ADMIN" : "USER" },
      select: userSelect,
    });
    res.status(201).json({ message: "user created success", result: user });
  } catch (error) {
    res.status(500).json({ message: "server error", error });
  }
};

export const updateAdminUser = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, email, password, role } = req.body;
    const existingUser = await prisma.user.findFirst({ where: { id } });
    if (!existingUser) return res.status(404).json({ message: "User Not Found!!!." });
    const user = await prisma.user.update({
      where: { id },
      data: {
        fullname: name ?? existingUser.fullname,
        email: email ?? existingUser.email,
        ...(password ? { password: hashpass.hashSync(password) } : {}),
        ...(role === "ADMIN" || role === "USER" ? { role } : {}),
      },
      select: userSelect,
    });
    res.json({ message: "user updated success", result: user });
  } catch (error) {
    res.status(500).json({ message: "server error", error });
  }
};

export const deleteAdminUser = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    if (id === req.user?.id) return res.status(400).json({ message: "You cannot delete your own account" });
    const existingUser = await prisma.user.findFirst({ where: { id } });
    if (!existingUser) return res.status(404).json({ message: "User Not Found!!!." });
    await prisma.user.delete({ where: { id } });
    res.json({ message: "user deleted success" });
  } catch (error) {
    res.status(500).json({ message: "server error", error });
  }
};

export const getAdminOrders = async (req: AuthRequest, res: Response) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search : "";
    const status = typeof req.query.status === "string" ? req.query.status : "";
    const paymentStatus = typeof req.query.paymentStatus === "string" ? req.query.paymentStatus : "";
    const date = typeof req.query.date === "string" && !Number.isNaN(Date.parse(req.query.date)) ? new Date(req.query.date) : undefined;
    const academicRange = academicYearRange(req.query.academicYear);
    const dateStart = date ? new Date(date) : undefined;
    if (dateStart) dateStart.setHours(0, 0, 0, 0);
    const dateEnd = dateStart ? new Date(dateStart.getTime() + 24 * 60 * 60 * 1000) : undefined;
    const createdAtFilters: Array<{ createdAt: { gte?: Date; lt?: Date } }> = [];
    if (academicRange) createdAtFilters.push({ createdAt: academicRange });
    if (dateStart && dateEnd) createdAtFilters.push({ createdAt: { gte: dateStart, lt: dateEnd } });
    const price = typeof req.query.price === "string" ? req.query.price : "";
    const where = {
      ...(status ? { status } : {}),
      ...(paymentStatus ? { paymentStatus } : {}),
      ...(createdAtFilters.length ? { AND: createdAtFilters } : {}),
      ...(price === "under-50" ? { totalAmount: { lt: 50 } } : price === "50-200" ? { totalAmount: { gte: 50, lte: 200 } } : price === "over-200" ? { totalAmount: { gt: 200 } } : {}),
      ...(search ? { OR: [{ user: { fullname: { contains: search, mode: "insensitive" as const } } }, { items: { has: { productName: search } } }] } : {}),
    };
    const orders = await prisma.order.findMany({ where, include: { user: { select: userSelect }, Payment: { include: { user: { select: userSelect } } } }, orderBy: { createdAt: "desc" } });
    res.json({ message: "orders loaded", result: orders });
  } catch (error) {
    res.status(500).json({ message: "server error", error });
  }
};

export const getAdminCategories = async (req: AuthRequest, res: Response) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const status = req.query.status === "active" ? true : req.query.status === "inactive" ? false : undefined;
    const date = typeof req.query.date === "string" && !Number.isNaN(Date.parse(req.query.date)) ? new Date(req.query.date) : undefined;
    const academicRange = academicYearRange(req.query.academicYear);
    const dateStart = date ? new Date(date) : undefined;
    if (dateStart) dateStart.setHours(0, 0, 0, 0);
    const dateEnd = dateStart ? new Date(dateStart.getTime() + 24 * 60 * 60 * 1000) : undefined;
    const createdAtFilters: Array<{ createdAt: { gte?: Date; lt?: Date } }> = [];
    if (academicRange) createdAtFilters.push({ createdAt: academicRange });
    if (dateStart && dateEnd) createdAtFilters.push({ createdAt: { gte: dateStart, lt: dateEnd } });
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
    const where = {
      ...(status === undefined ? {} : { isActive: status }),
      ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { slug: { contains: search, mode: "insensitive" as const } }, { description: { contains: search, mode: "insensitive" as const } }] } : {}),
      ...(createdAtFilters.length ? { AND: createdAtFilters } : {}),
    };
    const categories = await prisma.category.findMany({
      where,
      select: { id: true, name: true, slug: true, description: true, imageUrl: true, isActive: true, createdAt: true, updatedAt: true, _count: { select: { Product: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });
    const total = await prisma.category.count({ where });
    res.json({ message: "categories loaded", result: categories, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ message: "server error", error });
  }
};

export const createAdminCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { name, slug, description, imageUrl, isActive } = req.body;
    const normalizedName = typeof name === "string" ? name.trim() : "";
    const normalizedSlug = typeof slug === "string" && slug.trim() ? slug.trim().toLowerCase() : normalizedName.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (!normalizedName) return res.status(400).json({ message: "Category name is required" });
    if (!normalizedSlug) return res.status(400).json({ message: "Category slug is required" });
    const existingCategory = await prisma.category.findFirst({ where: { OR: [{ name: normalizedName }, { slug: normalizedSlug }] } });
    if (existingCategory) return res.status(400).json({ message: "Category name or slug already exists" });
    const category = await prisma.category.create({
      data: { name: normalizedName, slug: normalizedSlug, description: typeof description === "string" ? description.trim() || null : null, imageUrl: typeof imageUrl === "string" ? imageUrl.trim() || null : null, isActive: isActive !== false, userId: req.user?.id! },
      select: { id: true, name: true, slug: true, description: true, imageUrl: true, isActive: true, createdAt: true, updatedAt: true, _count: { select: { Product: true } } },
    });
    res.status(201).json({ message: "category created success", result: category });
  } catch (error) {
    res.status(500).json({ message: "server error", error });
  }
};

export const updateAdminCategory = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return res.status(404).json({ message: "Category not found" });
    const { name, slug, description, imageUrl, isActive } = req.body;
    const normalizedName = typeof name === "string" ? name.trim() : category.name;
    const normalizedSlug = typeof slug === "string" && slug.trim() ? slug.trim().toLowerCase() : category.slug;
    if (!normalizedName || !normalizedSlug) return res.status(400).json({ message: "Category name and slug are required" });
    const duplicateCategory = await prisma.category.findFirst({ where: { id: { not: id }, OR: [{ name: normalizedName }, { slug: normalizedSlug }] } });
    if (duplicateCategory) return res.status(400).json({ message: "Category name or slug already exists" });
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: { name: normalizedName, slug: normalizedSlug, description: typeof description === "string" ? description.trim() || null : category.description, imageUrl: typeof imageUrl === "string" ? imageUrl.trim() || null : category.imageUrl, ...(typeof isActive === "boolean" ? { isActive } : {}) },
      select: { id: true, name: true, slug: true, description: true, imageUrl: true, isActive: true, createdAt: true, updatedAt: true, _count: { select: { Product: true } } },
    });
    res.json({ message: "category updated success", result: updatedCategory });
  } catch (error) {
    res.status(500).json({ message: "server error", error });
  }
};

export const deleteAdminCategory = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const category = await prisma.category.findUnique({ where: { id }, include: { _count: { select: { Product: true } } } });
    if (!category) return res.status(404).json({ message: "Category not found" });
    if (category._count.Product > 0) return res.status(409).json({ message: "This category has products. Move or delete its products before deleting it." });
    await prisma.category.delete({ where: { id } });
    res.json({ message: "category deleted success" });
  } catch (error) {
    res.status(500).json({ message: "server error", error });
  }
};

export const updateAdminOrder = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const order = await prisma.order.findFirst({ where: { id } });
    if (!order) return res.status(404).json({ message: "Order not found" });
    const status = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].includes(req.body.status) ? req.body.status : order.status;
    const paymentStatus = ["PENDING", "PAID", "FAILED", "REFUNDED"].includes(req.body.paymentStatus) ? req.body.paymentStatus : order.paymentStatus;
    const updatedOrder = await prisma.order.update({ where: { id }, data: { ispaid: typeof req.body.ispaid === "boolean" ? req.body.ispaid : paymentStatus === "PAID", status, paymentStatus, ...(typeof req.body.paymentMethod === "string" ? { paymentMethod: req.body.paymentMethod } : {}) } });
    res.json({ message: "order updated success", result: updatedOrder });
  } catch (error) {
    res.status(500).json({ message: "server error", error });
  }
};

export const deleteAdminOrder = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ message: "Order not found" });
    await prisma.order.delete({ where: { id } });
    res.json({ message: "order deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "server error", error });
  }
};
