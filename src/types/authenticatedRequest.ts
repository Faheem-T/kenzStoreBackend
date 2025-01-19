import { RequestHandler } from "express-serve-static-core";

interface UserRequest {
  userId: string;
}
interface AdminRequest {
  adminId: string;
}

export type AuthenticatedRequestHandler<
  P = {},
  resBody = {},
  reqBody = {},
  Q = {}
> = RequestHandler<P, resBody, reqBody, Q, UserRequest>;

export type AdminRequestHandler<
  P = {},
  resBody = {},
  reqBody = {},
  Q = {}
> = RequestHandler<P, resBody, reqBody, Q, AdminRequest>;
