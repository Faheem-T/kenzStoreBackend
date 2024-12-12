import Express from "express";
import dotenv from "dotenv";

dotenv.config();
const app = Express();
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is runnig on port ${port}`);
});
