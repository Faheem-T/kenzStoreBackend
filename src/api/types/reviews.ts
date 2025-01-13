import { UserType } from "./user";

// SHARED TYPE: Sync with frontend
export interface ReviewType {
    _id?: string;
    productId: string;
    userId: string;
    rating: number;
    comment?: string;
    helpfulCount?: number;
    verifiedPurchase?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

// SHARED TYPE: Sync with frontend
export interface UserPopulatedReviewType extends Omit<ReviewType, "userId"> {
    userId: Pick<UserType, "firstName">
}
