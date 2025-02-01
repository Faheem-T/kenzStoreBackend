import {
  AdminRequestHandler,
  UserRequestHandler,
} from "../types/authenticatedRequest";
import { Order } from "../models/orderModel";
import {
  GetUserOrder,
  OrderStatus,
  orderStatuses,
  OrderType,
  PlaceOrderType,
  ProductPopulatedOrderType,
} from "../types/order";
import { Address } from "../models/addressModel";
import { Cart } from "../models/cartModel";
import { Product } from "../models/productModel";
import { ProductType } from "../types/product";
import mongoose, { ObjectId } from "mongoose";
import { AddressType } from "../types/address";
import { BaseResponse } from "../types/baseResponse";
import { ProductPopulatedItem } from "../types/item";

// SHARED TYPE: Sync with frontend
interface PlaceOrderResponse {
  success: boolean;
  message: string;
  data?: { orderId: string };
  errors?: CartValidationErrorType[];
}
// SHARED TYPE: Sync with frontend
interface CartValidationErrorType {
  item: ObjectId;
  error: string;
  requested?: number;
  available?: number;
}

class CartValidationError extends Error {
  validationErrors: CartValidationErrorType[];
  constructor(message: string, validationErrors: CartValidationErrorType[]) {
    super(message);
    this.name = this.constructor.name;
    this.validationErrors = validationErrors;
  }
}

export const placeOrder: UserRequestHandler<
  {},
  PlaceOrderResponse,
  PlaceOrderType
> = async (req, res, next) => {
  const userId = req.userId;

  if (!userId) {
    res.status(400).json({
      success: false,
      message: "User is not authenticated",
    });
    return;
  }

  const { cartId, addressId, paymentMethod } = req.body;

  try {
    // // fetch address
    // const foundAddress = await Address.findOne({ _id: addressId, userId });
    // if (!foundAddress) {
    //   res.status(400).json({
    //     success: false,
    //     message: "Address not found",
    //   });
    //   return;
    // }

    try {
      const order = await processOrder({
        cartId,
        userId,
        paymentMethod,
        addressId,
      });
      res.status(200).json({
        success: true,
        message: "Order placed successfully",
        data: { orderId: order.id },
      });
    } catch (error) {
      if (error instanceof CartValidationError) {
        res.status(400).json({
          success: false,
          message: error.message,
          errors: error.validationErrors,
        });
      } else {
        throw error;
      }
      return;
    }
  } catch (error) {
    next(error);
  }
};

const processOrder = async ({
  cartId,
  userId,
  paymentMethod,
  addressId,
}: {
  cartId: string;
  userId: string;
  paymentMethod: string;
  addressId: string;
}) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // validate cart
    const cart = await validateCart(cartId, userId);

    // update stocks
    const stockUpdates = cart.items.map((item) => ({
      updateOne: {
        filter: {
          _id: item.productId._id,
          stock: { $gte: item.quantity },
        },
        update: {
          $inc: { stock: -item.quantity },
        },
      },
    }));

    const stockUpdateResult = await Product.bulkWrite(stockUpdates, {
      session,
    });
    if (stockUpdateResult.modifiedCount !== cart.items.length) {
      throw new Error("Stock levels changed during processing");
    }

    // fetch address
    const foundAddress = await Address.findOne<
      Pick<
        AddressType,
        "address_line" | "city" | "state" | "pincode" | "landmark"
      >
    >({ _id: addressId, userId }, "address_line city state pincode landmark");
    if (!foundAddress) {
      throw new Error("Address not found");
    }

    const orderAddress = {
      address_line: foundAddress.address_line,
      city: foundAddress.city,
      state: foundAddress.state,
      pincode: foundAddress.pincode,
      landmark: foundAddress.landmark,
    };

    // empty the cart
    await Cart.findOneAndUpdate({ userId, _id: cartId }, { items: [] });

    // create order
    const order = await Order.create(
      [
        {
          userId,
          items: cart.items,
          paymentMethod,
          address: orderAddress,
          // TODO Other order details
        },
      ],
      { session }
    );
    await session.commitTransaction();
    // TODO look into the index
    return order[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const validateCart = async (
  //   cart: PickProductPopulatedCartType<"stock" | "price" | "isDeleted" | "listed">
  cartId: string,
  userId: string
) => {
  // fetch cart
  const cart = await Cart.findOne({ _id: cartId, userId }).populate<{
    items: {
      _id: mongoose.Schema.Types.ObjectId;
      productId: Pick<
        ProductType,
        | "_id"
        | "stock"
        | "discountType"
        | "discountValue"
        | "price"
        | "finalPrice"
        | "isDeleted"
        | "listed"
        | "discountStartDate"
        | "discountEndDate"
        | "category"
      >;
      price: number;
      quantity: number;
    }[];
  }>({
    path: "items.productId",

    select:
      "_id stock discountStartDate discountEndDate isDiscountActive discountType discountValue price finalPrice isDeleted listed category",
    populate: {
      path: "category",
    },
  });
  console.log("Cart Items:");
  console.log(cart?.items.map((item) => item.productId));

  if (!cart) {
    throw new Error("Cart not found");
  }

  const items = cart.items;

  const validationErrors: CartValidationErrorType[] = [];
  items.forEach((item) => {
    const product = item.productId;
    if (!product) {
      validationErrors.push({
        item: item._id,
        error: "Product no longer exists",
      });
      return;
    }
    if (product.isDeleted) {
      validationErrors.push({ item: item._id, error: "Product is deleted" });
      return;
    }
    if (product.listed === false) {
      validationErrors.push({
        item: item._id,
        error: "Product is not available",
      });
      return;
    }
    if (product.stock < item.quantity) {
      validationErrors.push({
        item: item._id,
        error: "Insufficient quantity",
        requested: item.quantity,
        available: product.stock,
      });
      return;
    }
    // ensure prices are up to date
    if (product.finalPrice !== item.price) {
      validationErrors.push({
        item: item._id,
        error: "Price has changed",
      });
      return;
    }
  });
  if (validationErrors.length > 0) {
    throw new CartValidationError("Cart validation failed", validationErrors);
  }
  return cart;
};

export const cancelOrder: UserRequestHandler<{
  orderId: string;
}> = async (req, res, next) => {
  const orderId = req.params.orderId;
  const userId = req.userId;
  if (!orderId) {
    res.status(400).json({
      success: false,
      message: "Order ID is required",
    });
    return;
  }

  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404).json({
      success: false,
      message: "Order not found",
    });
    return;
  }

  if (order.userId.toString() !== userId) {
    res.status(403).json({
      success: false,
      message: "You are not authorized to cancel this order",
    });
    return;
  }

  if (order.status === "cancelled" || order.status === "completed") {
    res.status(400).json({
      success: false,
      message: "Order is already " + order.status,
    });
    return;
  }

  order.status = "cancelled";
  order.cancelledAt = new Date();
  try {
    await order.save();
    res.status(200).json({
      success: true,
      message: "Order has been cancelled successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsersOrders: UserRequestHandler<
  {},
  BaseResponse<GetUserOrder[]>
> = async (req, res, next) => {
  const userId = req.userId as string;
  try {
    const foundOrders = await Order.find({ userId }).populate<{
      items: ProductPopulatedItem<
        Pick<ProductType, "name" | "description" | "images" | "_id">
      >[];
    }>("items.productId", "name description images _id");
    if (!foundOrders) {
      res.status(400).json({
        success: false,
        message: "Couldn't find orders",
      });
      return;
    }
    res.status(200).json({
      success: true,
      data: foundOrders,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrder: UserRequestHandler<{
  orderId: string;
}> = async (req, res, next) => {
  const orderId = req.params.orderId;
  const userId = req.userId;
  if (!orderId) {
    res.status(400).json({
      success: false,
      message: "Order ID is required",
    });
    return;
  }
  try {
    const foundOrder = await Order.findOne({ _id: orderId, userId });
    if (!foundOrder) {
      res.status(400).json({
        success: false,
        message: "Could not find order",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: foundOrder,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllOrders: AdminRequestHandler = async (req, res, next) => {
  const adminId = req.adminId;
  if (!adminId) {
    res.status(403).json({
      success: false,
      message: "Only admins can access this route",
    });
    return;
  }

  try {
    const foundOrders = await Order.find({}).populate<{
      items: ProductPopulatedItem<
        Pick<ProductType, "name" | "description" | "images" | "_id">
      >[];
    }>("items.productId", "name description images _id");
    res.status(200).json({
      success: true,
      data: foundOrders,
    });
  } catch (error) {
    next(error);
  }
};

export const editOrder: AdminRequestHandler<
  { orderId: string },
  any,
  Partial<OrderType>
> = async (req, res, next) => {
  const adminId = req.adminId as string;
  const orderId = req.params.orderId;
  if (!orderId) {
    res.status(400).json({
      success: false,
      message: "Order ID is required",
    });
    return;
  }
  try {
    const updatedOrder = await Order.findByIdAndUpdate(orderId, req.body, {
      new: true,
    });
    if (!updatedOrder) {
      res.status(400).json({
        success: false,
        message: "Order not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

export const editOrderStatus: AdminRequestHandler<
  { orderId: string },
  any,
  { status: OrderStatus }
> = async (req, res, next) => {
  const adminId = req.adminId as string;
  const orderId = req.params.orderId;
  if (!orderId) {
    res.status(400).json({
      success: false,
      message: "Order ID is required",
    });
    return;
  }
  const { status } = req.body;
  if (!orderStatuses.includes(status)) {
    res.status(400).json({
      success: false,
      message: `${status} is not a valid status. Valid order statuses: ${orderStatuses.join(
        ", "
      )}`,
    });
  }
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status },
      {
        new: true,
      }
    );
    if (!updatedOrder) {
      res.status(400).json({
        success: false,
        message: "Order not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};
