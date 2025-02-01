import mongoose from "mongoose";
import { Cart } from "../models/cartModel";
import { Product } from "../models/productModel";
import { UserRequestHandler } from "../types/authenticatedRequest";
import { ProductType } from "../types/product";

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

    // const aggregationResult = await Product.aggregate([
    //   {
    //     $match: { _id: new mongoose.Types.ObjectId(productId) },
    //   },
    //   ...finalPriceCalculationAggregation,
    //   singleProductProjection,
    // ]);

    // const foundProduct = aggregationResult[0];

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
    const cart = await Cart.findOne({ userId }).populate({
      path: "items.productId",
      populate: { path: "category" },
    });
    // .populate("items.productId.category");
    // const aggregationCarts = await Cart.aggregate([
    //   // Match the cart for the specific user
    //   {
    //     $match: { userId: new mongoose.Types.ObjectId(userId) },
    //   },
    //   // Unwind the items array to process each item separately
    //   {
    //     $unwind: "$items",
    //   },
    //   // Perform a lookup to fetch product details
    //   {
    //     $lookup: {
    //       from: "products", // Collection name for products
    //       localField: "items.productId", // Field in Cart pointing to Product
    //       foreignField: "_id", // Field in Product to match
    //       as: "product", // Name of the new field to add the result
    //     },
    //   },
    //   // Unwind the product array
    //   {
    //     $unwind: "$product",
    //   },
    //   // Lookup for category details within the product
    //   {
    //     $lookup: {
    //       from: "categories", // Collection name for categories
    //       localField: "product.category",
    //       foreignField: "_id",
    //       as: "product.category",
    //     },
    //   },
    //   // Unwind the category array
    //   {
    //     $unwind: {
    //       path: "$product.category",
    //       preserveNullAndEmptyArrays: true, // Handle products without a category
    //     },
    //   },
    //   // Apply the discount calculation pipeline

    //   ...finalPriceCalculationAggregation.map((stage) => ({
    //     $replaceRoot: {
    //       newRoot: {
    //         $mergeObjects: ["$$ROOT", { product: stage }],
    //       },
    //     },
    //   })),
    //   // Reconstruct the cart with items including calculated final price
    //   {
    //     $group: {
    //       _id: "$_id", // Group by cart ID
    //       userId: { $first: "$userId" },
    //       items: {
    //         $push: {
    //           product: {
    //             _id: "$product._id",
    //             name: "$product.name",
    //             price: "$product.price",
    //             finalPrice: "$product.finalPrice",
    //             effectiveDiscount: "$product.effectiveDiscount",
    //             appliedDiscountName: "$product.appliedDiscountName",
    //           },
    //           quantity: "$items.quantity",
    //         },
    //       },
    //     },
    //   },
    //   // Optionally, project the final result
    //   {
    //     $project: {
    //       _id: 1,
    //       userId: 1,
    //       items: 1,
    //     },
    //   },
    // ]);

    // const cart = aggregationCarts[0];
    console.log(cart);

    if (!cart) {
      res.status(400).json({
        success: false,
        message: "Cart not found",
      });
      return;
    }
    cart?.items.forEach((item) => console.log(item));

    // calculate cart total
    let cartTotal = cart
      ? cart.items.reduce(
          (acc: number, item: any) =>
            acc + item.productId.finalPrice * item.quantity,
          0
        )
      : 0;

    cartTotal = Math.round(cartTotal * 100) / 100;

    res.status(200).json({
      success: true,
      data: {
        _id: cart?._id,
        userId: cart?.userId,
        items: cart?.items || [],
        cartTotal,
      },
    });
  } catch (error) {
    next(error);
  }
};

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
