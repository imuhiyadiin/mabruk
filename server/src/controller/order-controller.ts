import { Response } from "express";
import { AuthRequest } from "../midlewhere/auth";
import prisma from "../lip/prisma";


// create order

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    // get user
    const user = await prisma.user.findFirst({
      where: {
        id: req.user?.id,
      },
      include: {
        cart: {
          select: {
            id: true,
            cartItem: {
              select: {
                id: true,
                quanity: true,
                product: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if(!user?.cart?.cartItem){
        return res.status(404).json({
            message:"don't have a cart please create a cart!!."
        })
    }


    if (!user) {
      return res.status(404).json({
        message: "user not found",
      });
    }
    // total price
    const totalPrice = user.cart?.cartItem.reduce(
      (prev, current) => prev + +current.product.price,
      0
    );
    // total quantity
    const totalQuantity = user.cart?.cartItem.reduce(
      (prev, current) => prev + +current.quanity,
      0
    );

    const totalAmount = +totalPrice! * +totalQuantity!;

    const newOrder = await prisma.order.create({
      data: {
        totalAmount,
        userId: req.user?.id,
        items: user.cart?.cartItem,
      },
    });
    await prisma.cart.delete({
      where: {
        id: user.cart?.id,
      },
    });
    res.json({
      message: "order success",
      result: { ...newOrder },
    });
  } catch (error) {
    error;
  }
};


// get users order

export const getUserOrders = async(req:AuthRequest,res:Response)=>{
    try {
        
        const userOrder = await prisma.order.findMany()

        res.json({
            message:"user orde successfully dispalyed!.",
            result:[...userOrder]
        })

    } catch (error) {
        error
    }
}

export const updateOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { totalAmount, status } = req.body;

    // Hubi inuu order-ku jiro
    const order = await prisma.order.findFirst({
      where: {
        id :id as string,
      },
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: {
        id : id as string,
      },
      data: {
        totalAmount,
        
      },
    });

    return res.status(200).json({
      message: "Order updated successfully",
      result: updatedOrder,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
