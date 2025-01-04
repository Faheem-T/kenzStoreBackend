// SHARED TYPE: Sync with backend
export interface ProductType {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  categories: string[];
  specifications: Record<string, string | number>;
  isHero: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type CreateProductType = Omit<ProductType, '_id' | 'createdAt' | 'updatedAt'>;

export type UpdateProductType = Partial<CreateProductType>;