import Razorpay from "razorpay";
import { configDotenv } from "dotenv";
configDotenv();
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  throw new Error(
    "RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not found. Set it in your .env"
  );
}

const instance = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

export const createRazorpayOrder = async (amount: number) => {
  console.log("Amount: ", amount * 100, typeof (amount * 100));
  const options = {
    amount: Math.floor(amount * 100 * 100) / 100,
    currency: "INR",
    // receipt: "order_rcptid_11",
  };
  const order = await instance.orders.create(options);
  console.log(order);
  return order;
};
