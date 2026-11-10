import { Request, Response } from "express";
import { AuthRequest } from "../midlewhere/auth";
import prisma from "../lip/prisma";

// create product
export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      quantity,
      price,
      color,
      size,
      image,
      description,
      categoryId,
      slug,
    } = req.body;

    if(req.user?.role !== "ADMIN"){
      return res.status(405).json({
        message:"don't have access make operation!."
      })
    }

    if (!name || !quantity || !price || !image || !categoryId || !slug) {
      return res.status(400).json({
        message: "provide product info"
      });
    }

    const newProduct = await prisma.product.create({
      data: {
        imageUrl: image,
        name,
        price,
        quantity,
        description,
        categoryId,
        userId: req.user?.id!,
        color,
        size,
        slug,
      },
    });

    res.json({
      message: "prdoduct created success",
      result: { newProduct },
    });
  } catch (error) {
    res.status(500).json({
      message: "server error",
      error,
    });
  }
};

// get all products

export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!products) {
      return res.status(404).json({
        message: "products Not Found!.",
      });
    }
    res.json({
      message: "operation success",
      result: [...products],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "server error",
    });
  }
};
 
// get one product

export const getProduct = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const product = await prisma.product.findFirst({
      where: { OR: [{ slug: slug as string }, { id: slug as string }] },
      include: { category: { select: { id: true, name: true } } },
    });

    if (!product) {
      return res.status(404).json({
        message: "products Not Found!.",
      });
    }
    res.json({
      message: "operation success",
      result: { ...product },
    });
  } catch (error) {
    error;
  }
};

// update product
export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== "ADMIN") {
      return res.status(403).json({ message: "Only admins can update products." });
    }

    const identifier = req.params.slug as string;
    const product = await prisma.product.findFirst({
      where: { OR: [{ slug: identifier }, { id: identifier }] },
    });
    if (!product) return res.status(404).json({ message: "Product not found." });

    const { name, slug, price, quantity, categoryId, image, description, color, size } = req.body;
    const nextSlug = typeof slug === "string" ? slug.trim() : product.slug;
    if (nextSlug) {
      const duplicate = await prisma.product.findFirst({ where: { slug: nextSlug, id: { not: product.id } } });
      if (duplicate) return res.status(409).json({ message: "A product with this slug already exists." });
    }

    const updatedProduct = await prisma.product.update({
      where: { id: product.id },
      data: {
        ...(typeof name === "string" ? { name: name.trim() } : {}),
        ...(typeof slug === "string" ? { slug: nextSlug || null } : {}),
        ...(price !== undefined ? { price: Number(price) } : {}),
        ...(quantity !== undefined ? { quantity: Number(quantity) } : {}),
        ...(typeof categoryId === "string" ? { categoryId } : {}),
        ...(typeof image === "string" ? { imageUrl: image.trim() } : {}),
        ...(typeof description === "string" ? { description: description.trim() || null } : {}),
        ...(typeof color === "string" ? { color: color.trim() || null } : {}),
        ...(typeof size === "string" ? { size: size.trim() || null } : {}),
      },
      include: { category: { select: { id: true, name: true } } },
    });
    return res.status(200).json({ message: "Product updated successfully.", result: updatedProduct });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to update product." });
  }
};

// delete product
export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== "ADMIN") {
      return res.status(403).json({ message: "Only admins can delete products." });
    }

    const identifier = req.params.slug as string;
    const product = await prisma.product.findFirst({
      where: { OR: [{ slug: identifier }, { id: identifier }] },
    });
    if (!product) return res.status(404).json({ message: "Product not found." });

    await prisma.$transaction([
      prisma.cartItem.deleteMany({ where: { productId: product.id } }),
      prisma.product.delete({ where: { id: product.id } }),
    ]);
    return res.status(200).json({ message: "Product deleted successfully." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to delete product." });
  }
};
