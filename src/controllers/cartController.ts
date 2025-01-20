import { Cart } from "../models/cartModel";
import { Product } from "../models/productModel";
import { AuthenticatedRequestHandler } from "../types/authenticatedRequest";

export const addProductToCart: AuthenticatedRequestHandler<
  {},
  any,
  { productId: string; quantity?: string }
> = async (req, res, next) => {
  const userId = req.userId as string;
  const { productId, quantity = 1 } = req.body;

  try {
    // find product and ensure it is not deleted
    const foundProduct = await Product.findById(productId);
    if (!foundProduct) {
      res.status(400).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    if (foundProduct.isDeleted) {
      res.status(404).json({
        success: false,
        message: "This product has been deleted",
      });
      return;
    }
    let updatedCart;
    updatedCart = await Cart.findOneAndUpdate(
      // finding cart by userId and productId and incrementing quantity
      { userId, "items.productId": productId },
      { $inc: { "items.$.quantity": quantity } },
      { upsert: true, new: true }
    );

    if (!updatedCart) {
      // if cart not found, or productId not found, push a new item
      updatedCart = await Cart.findOneAndUpdate(
        { userId },
        { $push: { items: { productId, quantity } } },
        { upsert: true, new: true }
      );
    }

    if (!updatedCart) {
      res.status(400).json({
        success: false,
        message: "Failed to add product to cart",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product added to cart successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getCart: AuthenticatedRequestHandler = async (req, res, next) => {
  const userId = req.userId as string;
  try {
    const cart = await Cart.findOne({ userId }).populate("items.productId");
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
