import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { productEnhancements } from '../src/lib/database/schema';
import { eq } from 'drizzle-orm';
import { convertLocalPathToCloudinary } from '../src/lib/cloudinary-client';

// Database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

async function migrateToCloudinary() {
  console.log('🔄 Starting migration to Cloudinary image format...\n');

  try {
    // Get all product enhancements
    const enhancements = await db.select().from(productEnhancements);
    
    console.log(`Found ${enhancements.length} product enhancements to process\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const enhancement of enhancements) {
      if (!enhancement.additionalImages || enhancement.additionalImages.length === 0) {
        skippedCount++;
        continue;
      }

      let hasChanges = false;
      const updatedImages = enhancement.additionalImages.map((image: any) => {
        // Skip if already has public_id or is already a Cloudinary URL
        if (image.public_id || image.url.includes('res.cloudinary.com')) {
          return image;
        }

        // Convert local paths to Cloudinary format
        if (image.url.startsWith('/images/products/')) {
          const cloudinaryImage = convertLocalPathToCloudinary(image.url);
          hasChanges = true;
          console.log(`Converting: ${image.url} -> ${cloudinaryImage.public_id}`);
          return {
            ...image,
            public_id: cloudinaryImage.public_id,
          };
        }

        return image;
      });

      if (hasChanges) {
        await db
          .update(productEnhancements)
          .set({
            additionalImages: updatedImages,
            updatedAt: new Date(),
          })
          .where(eq(productEnhancements.id, enhancement.id));

        updatedCount++;
        console.log(`✅ Updated enhancement ${enhancement.id}`);
      } else {
        skippedCount++;
      }
    }

    console.log(`\n✅ Migration completed!`);
    console.log(`📊 Summary:`);
    console.log(`   - Updated: ${updatedCount} enhancements`);
    console.log(`   - Skipped: ${skippedCount} enhancements (no changes needed)`);
    console.log(`   - Total: ${enhancements.length} enhancements processed`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateToCloudinary();
}

export { migrateToCloudinary };
