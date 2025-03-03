import Express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
import { rootRouter } from "./routes/router";
import { errorHandlingMiddleware } from "./middlewares/errorMiddleware";
import { connectDB } from "./config/mongoConnection";
import cookieParser from "cookie-parser";

dotenv.config();

const app = Express();

const port = process.env.PORT || 3000;

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(
  cors({
    credentials: true,
    // origin:
    //   process.env.NODE_ENV === "production"
    //     ? "https://www.kenzstore.faheem-mb.com"
    //     : "http://localhost:5173",
    origin: process.env.FRONTEND_URL,
  })
);
app.use(Express.json());
app.use(Express.urlencoded({ extended: false }));
app.use(cookieParser());

// MongoDB setup
connectDB();

app.use("/api/v1", rootRouter);

app.use(errorHandlingMiddleware);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
