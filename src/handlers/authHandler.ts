import { RequestHandler } from "express-serve-static-core";

export const get_me: RequestHandler = (req, res) => {
  res.send("hello from handler!!");
};
