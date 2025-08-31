import { productService } from '../src/lib/database/services/product-service';
import { PRODUCT_ENHANCEMENTS } from '../src/lib/product-enhancements';

async function migrateEnhancements() {
  console.log('Starting migration of product enhancements to database...');
  
  try {
    const enhancements = Object.entries(PRODUCT_ENHANCEMENTS);
    console.log(`Found ${enhancements.length} enhancements to migrate`);
    
    let migrated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const [externalId, enhancement] of enhancements) {
      try {
        // Find the product by external ID
        const product = await productService.getProductByExternalId(externalId);
        
        if (!product) {
          console.log(`⚠️  Product with external ID ${externalId} not found, skipping enhancement`);
          skipped++;
          continue;
        }
        
        // Check if enhancement already exists
        const existingEnhancement = await productService.getProductById(product.id);
        
        if (existingEnhancement?.enhancement) {
          console.log(`⚠️  Enhancement already exists for product ${product.name} (${externalId}), skipping`);
          skipped++;
          continue;
        }
        
        // Prepare enhancement data
        const enhancementData = {
          description: enhancement.description,
          shortDescription: enhancement.shortDescription,
          features: enhancement.features,
          specifications: enhancement.specifications,
          additionalImages: enhancement.additionalImages,
          seo: enhancement.seo,
          defaultVariantId: enhancement.defaultVariant,
        };
        
        // Create the enhancement
        await productService.upsertEnhancement(product.id, enhancementData);
        
        console.log(`✅ Migrated enhancement for ${product.name} (${externalId})`);
        migrated++;
        
      } catch (error) {
        console.error(`❌ Error migrating enhancement for ${externalId}:`, error instanceof Error ? error.message : error);
        errors++;
      }
    }
    
    console.log('\nMigration completed!');
    console.log(`✅ Migrated: ${migrated}`);
    console.log(`⚠️  Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateEnhancements()
  .then(() => {
    console.log('Migration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
