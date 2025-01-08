export function populateCategories(depth: number = 3) {
  const populateRecursive = (currentDepth: number): any => {
    if (currentDepth <= 0) return null;

    return {
      path: 'parentCategory',
      model: 'Category',
      populate: populateRecursive(currentDepth - 1),
    select: "name parentCategory"
    };
  };

  return {
    path: 'categories',
    populate: populateRecursive(depth),
    select: "name parentCategory"
  };
}
