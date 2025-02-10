import { Order } from "../models/orderModel";
import { AdminRequestHandler } from "../types/authenticatedRequest";
import { BaseResponse } from "../types/baseResponse";

// SHARED
const timeframes = ["day", "month", "year"] as const;
type Timeframe = (typeof timeframes)[number];

// SHARED TYPE
type SalesReportBody = BaseResponse<{
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
    res.status(400).json({
      success: false,
      message: `invalid 'timeframe'. Allowed values are: ${timeframes.join(
        ", "
      )}. Got ${timeframe}`,
    });
    return;
  }
  let startDate;
  let endDate;
  let createdAt: Record<string, Date> = {};

  if (startDateString) {
    startDate = new Date(startDateString);
    if (isNaN(startDate.getTime())) {
      res.status(400).json({
        success: false,
        message: "Invalid start date",
      });
      return;
    }
    createdAt.$gte = startDate;
  }

  if (endDateString) {
    endDate = new Date(endDateString);
    if (isNaN(endDate.getTime())) {
      res.status(400).json({
        success: false,
        message: "Invalid end date",
      });
      return;
    }
    createdAt.$lte = endDate;
  }

  try {
    const completedOrders = await Order.find({
      status: "completed",
      ...(Object.keys(createdAt).length > 0 && { createdAt }),
    });
    const overallSalesCount = completedOrders.length;
    const overallOrderAmount = completedOrders.reduce(
      (acc, order) => acc + order.totalPrice,
      0
    );

    const orderCountByTimeframe = await getOrderCountByTimeframe(
      timeframe,
      startDate,
      endDate
    );
    const topSellingProducts = await getTopSellingProducts();
    const topSellingCategories = await getTopSellingCategories();
    const topSellingBrands = await getTopSellingBrands();
    res.status(200).json({
      success: true,
      data: {
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
    matchStage.createdAt = { $gte: startDate };
  }
  if (endDate) {
    matchStage.createdAt = { ...matchStage.createdAt, $lte: endDate };
  }

  const result = await Order.aggregate<{ _id: string; count: number }>([
    { $match: matchStage },
    {
      $group: {
        _id: { $dateToString: { format, date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    // { $sort: { _id: -1 } },
  ]);
  result.sort((a, b) => new Date(a._id).getTime() - new Date(b._id).getTime());
  console.log(result);
  return result;
};

const getTopSellingProducts = async () => {
  const products = await Order.aggregate<{ _id: string; count: number }>([
    {
      $match: { status: "completed" },
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

const getTopSellingCategories = async () => {
  const category = await Order.aggregate<{
    _id: { name: string };
    count: number;
  }>([
    {
      $match: { status: "completed" },
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

const getTopSellingBrands = async () => {
  const category = await Order.aggregate<{ _id: string; count: number }>([
    {
      $match: { status: "completed" },
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
