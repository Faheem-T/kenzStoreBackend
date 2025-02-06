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
}>;

export const getSalesReport: AdminRequestHandler<
  {},
  SalesReportBody,
  {},
  { timeframe?: Timeframe }
> = async (req, res, next) => {
  const { timeframe = "day" } = req.query;
  console.log(typeof timeframe);
  if (!timeframes.includes(timeframe)) {
    res.status(400).json({
      success: false,
      message: `invalid 'timeframe'. Allowed values are: ${timeframes.join(
        ", "
      )}. Got ${timeframe}`,
    });
    return;
  }

  try {
    const completedOrders = await Order.find({ status: "completed" });
    const overallSalesCount = completedOrders.length;
    const overallOrderAmount = completedOrders.reduce(
      (acc, order) => acc + order.totalPrice,
      0
    );
    const orderCountByTimeframe = await getOrderCountByTimeframe(timeframe);
    const topSellingProducts = await getTopSellingProducts();
    res.status(200).json({
      success: true,
      data: {
        totalSalesCount: overallSalesCount,
        totalSaleAmount: overallOrderAmount,
        orderCountByTimeframe,
        topSellingProducts,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getOrderCountByTimeframe = async (timeframe: Timeframe) => {
  let format = "%Y-%m-%d";
  switch (timeframe) {
    case "month":
      format = "%Y-%m";
      break;
    case "year":
      format = "%Y";
      break;
  }
  const result = await Order.aggregate<{ _id: string; count: number }>([
    { $match: { status: "completed" } },
    {
      $group: {
        _id: { $dateToString: { format, date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } }, // Sort by date
  ]);
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
      $limit: 5,
    },
  ]);
  return products;
};
