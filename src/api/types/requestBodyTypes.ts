import { ReviewType } from "./reviews";

export interface postCategoryRequestBodyType {
    name: string,
    parentCategory?: string
}

export type postProductReviewBodyType = Pick<ReviewType, "userId" | "comment" | "rating">
