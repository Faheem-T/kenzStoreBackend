import { Cart } from "../models/cartModel";
import { Product } from "../models/productModel";
import { UserRequestHandler } from "../types/authenticatedRequest";

export const addProductToCart: UserRequestHandler<
  {},
  any,
  { productId: string; quantity?: number }
> = async (req, res, next) => {
  const userId = req.userId as string;
  const { productId, quantity = 1 } = req.body;

  try {
    // make sure product exists
    const foundProduct = await Product.findById(productId).populate({
      path: "category",
      select:
        "name discountName discountType discountValue discountStartDate discountEndDate",
    });

    if (!foundProduct) {
      res.status(400).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    // make sure it is not deleted
    if (foundProduct.isDeleted) {
      res.status(404).json({
        success: false,
        message: "This product has been deleted",
      });
      return;
    }

    // make sure quantity is not more than stock
    if (foundProduct.stock < quantity) {
      res.status(400).json({
        success: false,
        message: "Not enough stock",
      });
      return;
    }

    let updatedCart;
    // Delete product from cart if quantity is 0
    if (quantity === 0) {
      const cart = await Cart.findOne({ userId });
      if (cart) {
        updatedCart = await Cart.findOneAndUpdate(
          { userId, "items.productId": productId },
          { $pull: { items: { productId } } },
          { new: true }
        );
      }
      if (updatedCart) {
        res.status(200).json({
          success: true,
          message: "Product removed from cart",
        });
        return;
      }
    }

    updatedCart = await Cart.findOneAndUpdate(
      // finding cart by userId and productId and setting quantity
      { userId, "items.productId": productId },
      {
        $set: {
          "items.$.quantity": quantity,
          "items.$.price": foundProduct.finalPrice, // also update price
        },
      },
      { new: true }
    );
    if (updatedCart) {
      res.status(200).json({
        success: true,
        message: "Product quantity updated in cart",
      });
      return;
    }

    // if cart not found, or productId not found, push a new item
    updatedCart = await Cart.findOneAndUpdate(
      { userId },
      {
        $push: {
          items: { productId, quantity, price: foundProduct.finalPrice },
        },
      },
      { upsert: true, new: true }
    );

    if (!updatedCart) {
      res.status(400).json({
        success: false,
        message: "Failed to add product to cart",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Product added to cart successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getCart: UserRequestHandler = async (req, res, next) => {
  const userId = req.userId as string;
  try {
    const cart = await Cart.findOne({ userId })
      .populate({
        path: "items.productId",
        populate: { path: "category" },
      })
      .populate("coupon", "_id name code");
    if (!cart) {
      res.status(400).json({
        success: false,
        message: "Cart not found",
      });
      return;
    }

    console.log(cart);

    res.status(200).json({
      success: true,
      data: {
        _id: cart._id,
        userId: cart.userId,
        items: cart.items ?? [],
        cartTotal: cart.cartTotal,
        coupon: cart.coupon,
        discountValue: cart.discountValue,
        discountType: cart.discountType,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Cart without the items populated
export const getMinimalCart: UserRequestHandler = async (req, res, next) => {
  const userId = req.userId as string;
  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      res.status(400).json({
        success: false,
        message: "Cart not found",
      });
      return;
    }
    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProductFromCart: UserRequestHandler<{
  productId: string;
}> = async (req, res, next) => {
  const userId = req.userId as string;
  const { productId } = req.params;
  try {
    const updatedCart = await Cart.findOneAndUpdate(
      { userId, "items.productId": productId },
      { $pull: { items: { productId } } },
      { new: true }
    );
    if (!updatedCart) {
      res.status(400).json({
        success: false,
        message: "Item not found in cart",
      });
      return;
    }
    res.status(200).json({
      success: true,
      message: "Item removed from cart",
    });
  } catch (error) {
    next(error);
  }
};

export const clearCart: UserRequestHandler = async (req, res, next) => {
  const userId = req.userId as string;
  try {
    const clearedCart = await Cart.findOneAndUpdate({ userId }, { items: [] });
    if (!clearedCart) {
      res.status(400).json({
        success: false,
        message: "Cart not found",
      });
      return;
    }
    res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
    });
  } catch (error) {
    next(error);
  }
};
