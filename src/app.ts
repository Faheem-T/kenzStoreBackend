import Express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";
import { rootRouter } from "./routes/router";
import { errorHandlingMiddleware } from "./middlewares/errorMiddleware";

dotenv.config();

const app = Express();

const port = process.env.PORT || 3000;

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(cors());
app.use(Express.json());
app.use(Express.urlencoded());

app.use("/api/v1", rootRouter);

app.use(errorHandlingMiddleware);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
