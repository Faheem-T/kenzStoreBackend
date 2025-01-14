import { sendOTPtoMail } from "../api/utils/nodeMailer";

test("Mail sends properly", () => {
  expect(sendOTPtoMail("faheemmbasheer@gmail.com")).not(toThrow());
});
