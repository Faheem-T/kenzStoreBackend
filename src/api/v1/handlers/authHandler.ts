import { RequestHandler } from "express-serve-static-core";

export const get_me: RequestHandler = (req, res) => {
  res.send("hello from handler!!");
};


export interface registerBody {
  firstName: string,
  lastName: string,
  email: string,
  DOB: Date,
  password: string
}

export const postRegister: RequestHandler<any, any, registerBody> = (req, res) => {
  console.log(req.body)
  res.send(req.body)
}
