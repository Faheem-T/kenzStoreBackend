export function populateCategories(
  depth: number = 3,
  path: string = "categories"
) {
  const populateRecursive = (currentDepth: number): any => {
    if (currentDepth <= 0) return null;

    return {
      path: "parentCategory",
      model: "Category",
      populate: populateRecursive(currentDepth - 1),
      select: "name parentCategory",
    };
  };

  return {
    path,
    populate: populateRecursive(depth),
    select: "name parentCategory",
  };
}
