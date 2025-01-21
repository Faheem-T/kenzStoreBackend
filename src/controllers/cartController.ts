import { Cart } from "../models/cartModel";
import { Product } from "../models/productModel";
import { AuthenticatedRequestHandler } from "../types/authenticatedRequest";
import { ProductType } from "../types/product";

export const addProductToCart: AuthenticatedRequestHandler<
  {},
  any,
  { productId: string; quantity?: number }
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
      { $set: { "items.$.quantity": quantity } },
      { new: true }
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

    // calculate cart total
    const cartTotal = cart.items.reduce(
      (acc, item) => acc + (item.productId as any as ProductType).finalPrice,
      0
    );

    res.status(200).json({
      success: true,
      data: { ...cart.toObject(), cartTotal },
    });
  } catch (error) {
    next(error);
  }
};

export const getMinimalCart: AuthenticatedRequestHandler = async (
  req,
  res,
  next
) => {
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

export const deleteProductFromCart: AuthenticatedRequestHandler<{
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

export const clearCart: AuthenticatedRequestHandler = async (
  req,
  res,
  next
) => {
  const userId = req.userId as string;
  try {
    const deletedCart = await Cart.findOneAndDelete({ userId });
    if (!deletedCart) {
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
