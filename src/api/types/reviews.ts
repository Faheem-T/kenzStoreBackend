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
