const select =
  "name slug parentCategory discountName discountType discountValue discountStartDate discountEndDate";

const populateSelect = "name slug";
export function populateCategory(depth: number = 3, path: string = "category") {
  const populateRecursive = (currentDepth: number): any => {
    if (currentDepth <= 0) return null;

    return {
      path: "parentCategory",
      model: "Category",
      populate: populateRecursive(currentDepth - 1),
      populateSelect,
    };
  };

  return {
    path,
    populate: populateRecursive(depth),
    select,
  };
}
