// create cart

import { Response } from "express";
import { AuthRequest } from "../midlewhere/auth";
import prisma from "../lip/prisma";

export const addCart = async (req: AuthRequest, res: Response) => {
  try {
    const { quantity, productId } = req.body;

    if (!quantity || !productId) {
      return res.status(400).json({
        message: "fill data",
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        id: req.user?.id,
      },
      include: { cart: true },
    });

    if (!user?.cart?.id) {
      const newCart = await prisma.cart.create({
        data: {
          userId: req.user?.id!,
        },
      });
      return res.json({
        result: { ...newCart },
      });
    }

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
      },
    });

    if (quantity > product?.quantity!) {
      return res.status(400).json({
        message: `not available this quantity ${quantity} `,
      });
    }

    const newItem = await prisma.cartItem.create({
      data: {
        quanity: +quantity,
        cartId: user?.cart?.id!,
        productId,
        userId: req.user?.id,
      },
      include: {
        product: true,
      },
    });

    res.json({
      message: "create cart and item success",
      result: { ...newItem },
    });
  } catch (error) {
    error;
  }
};

export const userCart = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: req.user?.id,
      },
      select: {
        id: true,
        fullname: true,
        email: true,
        cart: {
          select: {
            id: true,
            cartItem: {
              select: {
                id: true,
                quanity: true,
                product: true,
              },
            },
          },
        },
      },
    });

    res.json({
      message: "user cart is displayed!.",
      result: { ...user },
    });
  } catch (error) {
    error;
  }
};

// delete cartItem

export const deleteCartItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        id: req.user?.id,
      },
      include: {
        cartItem: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "Not Found!.",
      });
    }

    const deleteItem = await prisma.cartItem.delete({
      where: {
        id: id,
        userId: req.user?.id,
      },
    });

    res.json({
      message: "item deleted success",
      result: { ...deleteItem },
    });
  } catch (error) {
    error;
  }
};

