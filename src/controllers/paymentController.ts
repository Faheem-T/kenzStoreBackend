import { UserRequestHandler } from "../types/authenticatedRequest";
import { createRazorpayOrder } from "../utils/razorpay";

export const getRazorpayOrder: UserRequestHandler = async (req, res, next) => {
  const userId = req.userId as string;
  //   const;
  const order = await createRazorpayOrder(200);
  res.status(200).json({
    success: true,
    data: order,
  });
};
