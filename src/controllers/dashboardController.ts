import { HttpStatus } from "../utils/httpenum";
import { Order } from "../models/orderModel";
import { AdminRequestHandler } from "../types/authenticatedRequest";
import { BaseResponse } from "../types/baseResponse";
import { OrderType } from "../types/order";

// SHARED
const timeframes = ["day", "month", "year"] as const;
type Timeframe = (typeof timeframes)[number];

// SHARED TYPE
type SalesReportBody = BaseResponse<{
  orders: (Pick<
    OrderType,
    | "_id"
    | "userId"
    | "items"
    | "coupon"
    | "discountType"
    | "discountValue"
    | "paymentMethod"
    | "status"
    | "completedAt"
    | "totalPrice"
    | "originalPrice"
  > & { userId: { _id: string; name: string } })[];
  totalSalesCount: number;
  totalSaleAmount: number;
  orderCountByTimeframe: { _id: string; count: number }[];
  topSellingProducts: { _id: string /*ObjectId*/; count: number }[];
  topSellingCategories: { _id: { name: string }; count: number }[];
  topSellingBrands: { _id: string; count: number }[];
}>;

export const getSalesReport: AdminRequestHandler<
  {},
  SalesReportBody,
  {},
  { timeframe?: Timeframe; startDate: string; endDate: string }
> = async (req, res, next) => {
  const {
    timeframe = "day",
    startDate: startDateString,
    endDate: endDateString,
  } = req.query;
  if (!timeframes.includes(timeframe)) {
    res.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      message: `invalid 'timeframe'. Allowed values are: ${timeframes.join(
        ", "
      )}. Got ${timeframe}`,
    });
    return;
  }
  let startDate;
  let endDate;
  let completedAt: Record<string, Date> = {};

  if (startDateString) {
    startDate = new Date(startDateString);
    if (isNaN(startDate.getTime())) {
      res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: "Invalid start date",
      });
      return;
    }
    completedAt.$gte = startDate;
  }

  if (endDateString) {
    endDate = new Date(endDateString);
    if (isNaN(endDate.getTime())) {
      res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: "Invalid end date",
      });
      return;
    }
    completedAt.$lte = endDate;
  }

  try {
    // const completedOrders = await Order.find({
    //   status: "completed",
    //   ...(Object.keys(completedAt).length > 0 && { completedAt }),
    // });
    // const overallSalesCount = completedOrders.length;
    // const overallOrderAmount = completedOrders.reduce(
    //   (acc, order) => acc + order.totalPrice,
    //   0
    // );

    const { orders, overallOrderAmount, overallSalesCount } =
      await generateSalesReport(completedAt);

    const orderCountByTimeframe = await getOrderCountByTimeframe(
      timeframe,
      startDate,
      endDate
    );
    const topSellingProducts = await getTopSellingProducts(startDate, endDate);
    const topSellingCategories = await getTopSellingCategories(
      startDate,
      endDate
    );
    const topSellingBrands = await getTopSellingBrands(startDate, endDate);
    res.status(HttpStatus.OK).json({
      success: true,
      data: {
        orders,
        totalSalesCount: overallSalesCount,
        totalSaleAmount: overallOrderAmount,
        orderCountByTimeframe,
        topSellingProducts,
        topSellingCategories,
        topSellingBrands,
      },
    });
  } catch (error) {
    next(error);
  }
};

const generateSalesReport = async (completedAt: Record<string, Date>) => {
  const orders = await Order.find<
    Pick<
      OrderType,
      | "_id"
      | "userId"
      | "items"
      | "coupon"
      | "discountType"
      | "discountValue"
      | "paymentMethod"
      | "status"
      | "completedAt"
      | "totalPrice"
      | "originalPrice"
    > & { userId: { _id: string; name: string } }
  >(
    {
      status: "completed",
      ...(Object.keys(completedAt).length > 0 && { completedAt }),
    },
    "items coupon discountType discountValue paymentMethod status completedAt totalPrice originalPrice userId"
  )
    .sort({ completedAt: -1 })
    .populate("userId", "name");
  console.log(orders);
  const overallSalesCount = orders.length;
  const overallOrderAmount = orders.reduce(
    (acc, order) => acc + order.totalPrice,
    0
  );

  return { orders, overallOrderAmount, overallSalesCount };
};

const getOrderCountByTimeframe = async (
  timeframe: Timeframe,
  startDate?: Date,
  endDate?: Date
) => {
  let format = "%d %b %Y";
  switch (timeframe) {
    case "month":
      format = "%b %Y";
      break;
    case "year":
      format = "%Y";
      break;
  }

  const matchStage: any = { status: "completed" };
  if (startDate) {
    matchStage.completedAt = { $gte: startDate };
  }
  if (endDate) {
    matchStage.completedAt = { ...matchStage.completedAt, $lte: endDate };
  }

  const result = await Order.aggregate<{ _id: string; count: number }>([
    { $match: matchStage },
    {
      $group: {
        _id: { $dateToString: { format, date: "$completedAt" } },
        count: { $sum: 1 },
      },
    },
  ]);
  result.sort((a, b) => new Date(a._id).getTime() - new Date(b._id).getTime());
  return result;
};

const getTopSellingProducts = async (startDate?: Date, endDate?: Date) => {
  const matchStage: any = { status: "completed" };
  if (startDate) {
    matchStage.completedAt = { $gte: startDate };
  }
  if (endDate) {
    matchStage.completedAt = { ...matchStage.completedAt, $lte: endDate };
  }
  const products = await Order.aggregate<{ _id: string; count: number }>([
    {
      $match: matchStage,
    },
    {
      $unwind: "$items",
    },
    {
      $group: {
        _id: "$items.productId",
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
    {
      $limit: 10,
    },
  ]);
  return products;
};

const getTopSellingCategories = async (startDate?: Date, endDate?: Date) => {
  const matchStage: any = { status: "completed" };
  if (startDate) {
    matchStage.completedAt = { $gte: startDate };
  }
  if (endDate) {
    matchStage.completedAt = { ...matchStage.completedAt, $lte: endDate };
  }
  const category = await Order.aggregate<{
    _id: { name: string };
    count: number;
  }>([
    {
      $match: matchStage,
    },
    {
      $unwind: "$items",
    },
    {
      $lookup: {
        from: "products",
        as: "items.product",
        foreignField: "_id",
        localField: "items.productId",
        pipeline: [{ $project: { category: 1 } }],
      },
    },
    {
      $group: {
        _id: "$items.product.category",
        count: { $sum: 1 },
      },
    },
    {
      $unwind: "$_id",
    },
    {
      $lookup: {
        from: "categories",
        as: "_id",
        foreignField: "_id",
        localField: "_id",
        pipeline: [{ $project: { name: 1, _id: 0 } }],
      },
    },
    { $unwind: "$_id" },
    {
      $sort: { count: -1 },
    },
    {
      $limit: 10,
    },
  ]);
  return category;
};

const getTopSellingBrands = async (startDate?: Date, endDate?: Date) => {
  const matchStage: any = { status: "completed" };
  if (startDate) {
    matchStage.completedAt = { $gte: startDate };
  }
  if (endDate) {
    matchStage.completedAt = { ...matchStage.completedAt, $lte: endDate };
  }
  const category = await Order.aggregate<{ _id: string; count: number }>([
    {
      $match: matchStage,
    },
    {
      $unwind: "$items",
    },
    {
      $lookup: {
        from: "products",
        as: "items.product",
        foreignField: "_id",
        localField: "items.productId",
        pipeline: [{ $project: { brand: 1 } }],
      },
    },
    {
      $group: {
        _id: "$items.product.brand",
        count: { $sum: 1 },
      },
    },
    {
      $unwind: "$_id",
    },

    {
      $sort: { count: -1 },
    },
    {
      $limit: 10,
    },
  ]);
  return category;
};
