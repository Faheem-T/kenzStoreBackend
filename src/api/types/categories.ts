// SHARED TYPE: Sync with frontend
export interface CategoryType {
  _id: string;
  name: string;
  slug: string; // URL friendly category name
  description?: string;
  parentCategory?: string; // ObjectId of parent category
  image?: string;
  isActive: boolean;
  // deletion indicator
  isDeleted: boolean;
  // timestamp fields
  createdAt?: Date;
  updatedAt?: Date;
}

// Type for creating a new category
export type CreateCategoryType = Omit<
  CategoryType,
  "_id" | "createdAt" | "updatedAt"
>;

// Type for updating an existing category
export type UpdateCategoryType = Partial<CreateCategoryType>;
