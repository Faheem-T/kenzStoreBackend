import { configDotenv } from "dotenv";
configDotenv();
import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils";
import { Wallet } from "../models/walletModel";
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
  PaymentMethod,
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
import { CouponType } from "../types/coupon";
import { createRazorpayOrder } from "../utils/razorpay";
import { Orders } from "razorpay/dist/types/orders";

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
if (!RAZORPAY_KEY_SECRET) {
  throw new Error("RAZORPAY_KEY_SECRET not found. Set it in your .env");
}

const validSortFields = ["createdAt", "updatedAt"];

// SHARED TYPE: Sync with frontend
interface PlaceOrderResponse {
  success: boolean;
  message: string;
  data?: { orderId: string; razorpayOrder: Orders.RazorpayOrder | null };
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
    const order = await processOrder({
      cartId,
      userId,
      paymentMethod,
      addressId,
    });

    console.log("Order Placement ROrder: ", order.paymentOrder);

    res.status(200).json({
      success: true,
      data: { orderId: order.id, razorpayOrder: order.paymentOrder },
      message:
        paymentMethod === "cod"
          ? "Order placed successfully. Please prepare payment on delivery"
          : paymentMethod === "wallet"
          ? "Order placed successfully. Payment completed through wallet"
          : "Order created. Proceed to payment",
    });
  } catch (error) {
    if (error instanceof CartValidationError) {
      res.status(400).json({
        success: false,
        message: error.message,
        errors: error.validationErrors,
      });
    } else {
      next(error);
    }
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
  paymentMethod: PaymentMethod;
  addressId: string;
}) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // validate cart
    const cart = await validateCart(cartId, userId);

    // Don't allow cod for orders above 1000QR
    if (cart.cartTotal > 1000 && paymentMethod === "cod") {
      throw new Error("cod is not allowed for orders above QR 1000");
    }
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

    // create payment order according to payment method
    let ROrder = null;
    if (paymentMethod === "online") {
      ROrder = await createRazorpayOrder(cart.cartTotal);
    } else if (paymentMethod === "wallet") {
      const wallet = await Wallet.findOne({ user: userId });
      if (!wallet) {
        throw new Error("Payment Method is Wallet but couldn't fetch Wallet.");
      }
      if (wallet.balance < cart.cartTotal) {
        throw new Error("Insufficient wallet balance.");
      }

      wallet.balance = wallet.balance - cart.cartTotal;
      wallet.history = [
        ...wallet.history,
        {
          amount: -cart.cartTotal,
          logType: "order payment",
          notes: `Payment for order`,
          timestamp: new Date(),
        },
      ];
      wallet.save({ session });
    }
    // empty the cart
    await Cart.findOneAndUpdate(
      { userId, _id: cartId },
      { items: [], coupon: null, discountType: null, discountValue: 0 },
      { session }
    );

    // create order
    const order = await Order.create(
      [
        {
          userId,
          items: cart.items,
          paymentMethod,
          address: orderAddress,
          coupon: cart.coupon ? cart.coupon._id : null,
          discountType: cart.discountType,
          discountValue: cart.discountValue,
          paymentOrder: ROrder,
          paymentStatus: paymentMethod === "wallet" ? "paid" : "incomplete",
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

const validateCart = async (cartId: string, userId: string) => {
  // fetch cart
  const cart = await Cart.findOne({ _id: cartId, userId })
    .populate<{
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
    })
    .populate<{ coupon: CouponType }>("coupon");

  if (!cart) {
    throw new Error("Cart not found");
  }

  // validate applied coupon
  if (cart.coupon) {
    if (
      cart.coupon.discountType !== cart.discountType ||
      cart.coupon.discountValue !== cart.discountValue
    ) {
      throw new Error("Invalid coupon");
    }
    if (cart.coupon.validUntil && cart.coupon.validUntil < new Date()) {
      throw new Error("Coupon has expired");
    }
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
    if (order.paymentStatus === "paid") {
      order.paymentStatus = "refunded";
      await Wallet.findOneAndUpdate(
        { user: userId },
        {
          $inc: { balance: order.totalPrice },
          $push: {
            history: {
              amount: order.totalPrice,
              logType: "order cancellation",
              notes: `Cancelled order: ${order._id}`,
              timestamp: new Date(),
            },
          },
        },
        { upsert: true }
      );
      await order.save();
      res.status(200).json({
        success: true,
        message:
          "Order has been cancelled successfully. Payment has been added to wallet.",
      });
      return;
    }
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
  BaseResponse<GetUserOrder[]> & { currentPage?: number; totalPages?: number },
  any,
  {
    page: string;
    sort: "asc" | "desc";
    sortBy: string;
    limit: string;
  }
> = async (req, res, next) => {
  const {
    page = "1",
    sort = "desc",
    limit = "10",
    sortBy = "updatedAt",
  } = req.query;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const sortOrder = sort === "asc" ? 1 : -1;

  if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
    res
      .status(400)
      .json({ success: false, message: "Invalid pagination parameters" });
    return;
  }

  if (!validSortFields.includes(sortBy)) {
    res.status(400).json({
      success: false,
      message: `Invalid sortBy Field. Allowed fields are: ${validSortFields.join(
        ", "
      )}`,
    });
    return;
  }

  const userId = req.userId as string;
  try {
    const totalOrders = await Order.find({ userId }).countDocuments();
    const totalPages = Math.ceil(totalOrders / limitNum);
    const foundOrders = await Order.find({ userId })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ [sortBy]: sortOrder })
      .populate<{
        items: ProductPopulatedItem<
          Pick<
            ProductType,
            "name" | "description" | "images" | "_id" | "effectiveDiscount"
          >
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
      currentPage: pageNum,
      totalPages,
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

export const getAllOrders: AdminRequestHandler<
  {},
  BaseResponse<GetUserOrder[]> & { currentPage?: number; totalPages?: number },
  any,
  {
    orderStatus: OrderStatus;
    page: string;
    sort: "asc" | "desc";
    sortBy: string;
    limit: string;
  }
> = async (req, res, next) => {
  const adminId = req.adminId;
  const {
    orderStatus,
    page = "1",
    sort = "desc",
    sortBy = "updatedAt",
    limit = "10",
  } = req.query;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const sortOrder = sort === "asc" ? 1 : -1;

  if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
    res
      .status(400)
      .json({ success: false, message: "Invalid pagination parameters" });
    return;
  }

  if (!validSortFields.includes(sortBy)) {
    res.status(400).json({
      success: false,
      message: `Invalid sortBy Field. Allowed fields are: ${validSortFields.join(
        ", "
      )}`,
    });
    return;
  }
  if (!adminId) {
    res.status(403).json({
      success: false,
      message: "Only admins can access this route",
    });
    return;
  }

  const findQuery: any = {};
  if (orderStatus) {
    findQuery.status = orderStatus;
  }

  try {
    const totalOrders = await Order.find(findQuery).countDocuments();
    const totalPages = Math.ceil(totalOrders / limitNum);
    const foundOrders = await Order.find(findQuery)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ [sortBy]: sortOrder })
      .populate<{
        items: ProductPopulatedItem<
          Pick<
            ProductType,
            "name" | "description" | "images" | "_id" | "effectiveDiscount"
          >
        >[];
      }>("items.productId", "name description images _id")
      .sort({ [sortBy]: sortOrder });
    res.status(200).json({
      success: true,
      data: foundOrders,
      currentPage: pageNum,
      totalPages,
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
    const order = await Order.findById(orderId);

    if (!order) {
      res.status(400).json({
        success: false,
        message: "Order not found",
      });
      return;
    }

    if (order.status === "requesting return") {
      res.status(400).json({
        success: false,
        message: `Order status is ${order.status}. Either approve or reject the request before changing order status.`,
      });
      return;
    }

    order.status = status;
    if (status === "completed") {
      order.completedAt = new Date();
    }
    await order.save();

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyPayment: UserRequestHandler<
  {},
  any,
  {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
    orderId?: string;
  }
> = async (req, res, next) => {
  const userId = req.userId as string;
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    orderId,
  } = req.body;
  const paymentVerified = validatePaymentVerification(
    { order_id: razorpay_order_id, payment_id: razorpay_payment_id },
    razorpay_signature,
    RAZORPAY_KEY_SECRET
  );

  if (!paymentVerified) {
    res.status(400).json({
      success: false,
      message: "Payment is not verified",
    });
    return;
  }

  try {
    // updating order payment status
    const order = await Order.findOne({
      userId,
      ...(orderId ? { _id: orderId } : {}),
    }).sort({
      createdAt: -1,
    });
    if (!order) {
      res.status(400).json({
        success: false,
        message: "Couldn't find order",
      });
      return;
    }
    order.paymentStatus = "paid";
    await order.save();
    res.status(200).json({
      success: true,
      message: "Payment has been verified successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const requestOrderReturn: UserRequestHandler<{
  orderId: string;
}> = async (req, res, next) => {
  const userId = req.userId;
  const orderId = req.params.orderId;
  if (!orderId) {
    res.status(400).json({
      success: false,
      message: "'orderId' is required",
    });
  }

  try {
    const order = await Order.findOneAndUpdate(
      { _id: orderId, userId },
      { status: "requesting return" },
      { new: true }
    );
    if (!order) {
      res.status(400).json({
        success: false,
        message: "Couldn't find order",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Return of order has been requested",
    });
  } catch (error) {
    next(error);
  }
};

export const approveOrderReturn: AdminRequestHandler<{
  orderId: string;
}> = async (req, res, next) => {
  const orderId = req.params.orderId;
  if (!orderId) {
    res.status(400).json({
      success: false,
      message: "'orderId' is required",
    });
    return;
  }

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      res.status(400).json({
        success: false,
        message: "Order not found",
      });
      return;
    }

    order.status = "returned";

    await Wallet.findOneAndUpdate(
      { user: order.userId },
      {
        $inc: { balance: order.totalPrice },
        $push: {
          history: {
            amount: order.totalPrice,
            logType: "refund",
            notes: `refund for order number ${order._id}`,
            timestamp: new Date(),
          },
        },
      }
    );

    order.paymentStatus = "refunded";

    await order.save();

    res.status(200).json({
      success: true,
      message:
        "Order has been marked as returned and payment has been refunded",
    });
  } catch (error) {
    next(error);
  }
};

export const rejectOrderReturn: AdminRequestHandler<{
  orderId: string;
}> = async (req, res, next) => {
  const orderId = req.params.orderId;
  if (!orderId) {
    res.status(400).json({
      success: false,
      message: "'orderId' is required",
    });
    return;
  }

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      res.status(400).json({
        success: false,
        message: "Order not found",
      });
      return;
    }

    order.status = "completed";

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order return request has been rejected",
    });
  } catch (error) {
    next(error);
  }
};

export const retryPayment: UserRequestHandler<{ orderId: string }> = async (
  req,
  res,
  next
) => {
  const orderId = req.params.orderId;
  if (!orderId) {
    res.status(400).json({
      success: false,
      message: "'orderId' is required",
    });
    return;
  }
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      res.status(400).json({
        success: false,
        message: "Couldn't find order",
      });
      return;
    }

    if (order.paymentMethod === "cod") {
      res.status(400).json({
        success: false,
        message: "Payment method is 'cod'",
      });
      return;
    }

    if (order.paymentStatus === "paid") {
      res.status(400).json({
        success: false,
        message: "Payment has already been completed",
      });
      return;
    }

    const ROrder = await createRazorpayOrder(order.totalPrice);
    order.paymentOrder = ROrder;
    await order.save();
    console.log("Retry ROrder: ", ROrder);
    res.status(200).json({
      success: true,
      data: { razorpayOrder: ROrder },
    });
  } catch (error) {
    next(error);
  }
};
