import { ReviewType } from "./reviews";

export type postProductReviewBodyType = Pick<ReviewType, "comment" | "rating">;
