import { Request, Response } from "express";
import { AuthRequest } from "../midlewhere/auth";
import prisma from "../lip/prisma";

//create category
export const createCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, image } = req.body;
    const categoryName = typeof name === "string" ? name.trim() : "";
    if (!categoryName) {
      return res.status(400).json({
        message: "enter name of category",
      });
    }

    const existCatory = await prisma.category.findFirst({
      where: { name: categoryName },
    });

    if (existCatory) {
      return res.status(400).json({
        message: "category is already exist",
      });
    }

    const newCatefory = await prisma.category.create({
      data: {
        name: categoryName,
        description: typeof description === "string" ? description.trim() || null : null,
        imageUrl: typeof image === "string" ? image.trim() || null : null,
        userId: req.user?.id!,
      },
    });
    res.json({
      message: "category created success",
      result: { ...newCatefory },
    });
  } catch (error) {
    res.status(500).json({
      message: "server error",
      error,
    });
  }
};
// get all category
export const getCategories = async (req: Request, res: Response) => {
  try {
    const allCategories = await prisma.category.findMany({
      include: {
        Product: true,
        user: {
          select: {
            fullname: true,
            role: true,
            email: true,
            createdAt: true,
          },
        },
      },
    });

    res.json({
      message: "get category success",
      result: [...allCategories],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "server error",
    });
  }
};
// get one category
export const getCategory = async (req: Request, res: Response) => {
  try {
    const { name } = req.params;

    const oneCategory = await prisma.category.findFirst({
      where: {
        name : name as string,
      },
      include: {
        Product: true,
        user: {
          select: {
            fullname: true,
            role: true,
            email: true,
            createdAt: true,
          },
        },
      },
    });

    if (!oneCategory) {
      return res.status(404).json({
        message: "category Not Found",
      });
    }

    res.json({
      message: "get category success",
      result: { ...oneCategory },
    });
  } catch (error) {
    error;
  }
};

// update category
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const { name: requestedName, newName, description, image } = req.body;

    // Hubi inuu category-gu jiro
    const category = await prisma.category.findFirst({
      where: {
        name: name as string,
      },
    });

    if (!category) {
      return res.status(404).json({
        message: "Category Not Found",
      });
    }

    const normalizedName = typeof requestedName === "string"
      ? requestedName.trim()
      : typeof newName === "string"
        ? newName.trim()
        : category.name;
    if (!normalizedName) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const duplicateCategory = await prisma.category.findFirst({
      where: { name: normalizedName, id: { not: category.id } },
    });
    if (duplicateCategory) {
      return res.status(409).json({ message: "category is already exist" });
    }

    const updatedCategory = await prisma.category.update({
      where: {
        id: category.id,
      },
      data: {
        name: normalizedName,
        ...(typeof description === "string" ? { description: description.trim() || null } : {}),
        ...(typeof image === "string" ? { imageUrl: image.trim() || null } : {}),
      },
      include: {
        Product: true,
        user: {
          select: {
            fullname: true,
            role: true,
            email: true,
            createdAt: true,
          },
        },
      },
    });

    return res.status(200).json({
      message: "Category updated successfully",
      result: updatedCategory,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

// delete category
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { name } = req.params;

    // Hubi inuu category-gu jiro
    const category = await prisma.category.findFirst({
      where: {
        name: name as string,
      },
    });

    if (!category) {
      return res.status(404).json({
        message: "Category Not Found",
      });
    }

    const categoryWithProducts = await prisma.category.findUnique({
      where: { id: category.id },
      include: { _count: { select: { Product: true } } },
    });
    if (categoryWithProducts && categoryWithProducts._count.Product > 0) {
      return res.status(409).json({
        message: "This category has products. Move or delete its products before deleting it.",
      });
    }

    await prisma.category.delete({
      where: {
        id: category.id,
      },
    });

    return res.status(200).json({
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
