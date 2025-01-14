import nodemailer, { createTransport } from "nodemailer";
import { configDotenv } from "dotenv";
import { MailOptions } from "nodemailer/lib/sendmail-transport";
configDotenv();

const host = process.env.NODE_MAILER_HOST;
const port = Number(process.env.NODE_MAILER_PORT);
const user = process.env.NODE_MAILER_GMAIL;
const pass = process.env.NODE_MAILER_GMAIL_APP_PASSWORD;

if (!host || !port || !user || !pass) {
  throw new Error(
    "Missing NODE_MAILER_HOST, NODE_MAILER_PORT, NODE_MAILER_GMAIL or NODE_MAILER_GMAIL_APP_PASSWORD not found.\nSet them in your .env"
  );
}
// if (!port) {
//   throw new Error(
//     "Node Mailer Port not found. (Set the 'NODE_MAILER_PORT' env variable in your .env)"
//   );
// }

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: true,
  auth: {
    user,
    pass,
  },
});

export const generateOtp = (): number => {
  return Math.trunc(Math.random() * 1000000);
};

export const sendOTPtoMail = (userGmail: string, otp: number) => {
  const mailOptions: MailOptions = {
    from: user,
    to: userGmail,
    subject: "OTP For Kenz Store Registration",
    text: `Your OTP is \n${otp}`,
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email", error);
    } else {
      console.log("Email sent: ", info.response);
    }
  });
};
