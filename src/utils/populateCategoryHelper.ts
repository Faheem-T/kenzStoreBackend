const select =
  "name parentCategory discountName discountType discountValue discountStartDate discountEndDate";
export function populateCategory(depth: number = 3, path: string = "category") {
  const populateRecursive = (currentDepth: number): any => {
    if (currentDepth <= 0) return null;

    return {
      path: "parentCategory",
      model: "Category",
      populate: populateRecursive(currentDepth - 1),
      select,
    };
  };

  return {
    path,
    populate: populateRecursive(depth),
    select,
  };
}
