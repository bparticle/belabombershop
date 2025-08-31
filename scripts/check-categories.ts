import { categoryService } from '../src/lib/database/services/category-service';
import { productService } from '../src/lib/database/services/product-service';

async function checkCategories() {
  try {
    console.log('Checking categories and product assignments...\n');

    // Get all categories
    const categories = await categoryService.getAllCategories();
    console.log(`Found ${categories.length} categories:`);
    categories.forEach(cat => {
      console.log(`- ${cat.name} (${cat.id}) - Color: ${cat.color || 'No color'}`);
    });

    console.log('\n---\n');

    // Get all products with their categories
    const products = await productService.getActiveProducts();
    console.log(`Found ${products.length} active products:`);
    
    products.forEach(product => {
      const categoryNames = product.categories?.map(cat => cat.name).join(', ') || 'No categories';
      console.log(`- ${product.name}: ${categoryNames}`);
    });

    console.log('\n---\n');

    // Check products by category
    for (const category of categories) {
      const productsInCategory = await productService.getProductsByCategory(category.slug);
      console.log(`${category.name}: ${productsInCategory.length} products`);
    }

  } catch (error) {
    console.error('Error checking categories:', error);
  }
}

checkCategories();
