export function populateCategories(depth: number = 3) {
  const populateRecursive = (currentDepth: number): any => {
    if (currentDepth <= 0) return null;
    
    return {
      path: 'parentCategory',
      model: 'Category',
      populate: populateRecursive(currentDepth - 1)
    };
  };

  return {
    path: 'categories',
    populate: populateRecursive(depth)
  };
}