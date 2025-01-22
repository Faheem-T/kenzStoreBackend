import { ReviewType } from "./reviews";

export type postProductReviewBodyType = Pick<
  ReviewType,
  "userId" | "comment" | "rating"
>;
