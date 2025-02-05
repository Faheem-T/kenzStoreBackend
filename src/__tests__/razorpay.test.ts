import { createRazorpayOrder } from "../utils/razorpay";

test("Creates order successfully", () => {
  expect(createRazorpayOrder()).toBe(1);
});
