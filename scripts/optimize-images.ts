#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';

const PRODUCTS_IMAGE_DIR = join(process.cwd(), 'public', 'images', 'products');
const MAX_WIDTH = 1000;
const QUALITY = 85; // WebP quality (0-100)

interface ImageStats {
  originalSize: number;
  optimizedSize: number;
  savings: number;
  savingsPercent: number;
}

async function checkImageMagick(): Promise<boolean> {
  try {
    execSync('magick --version', { stdio: 'ignore' });
    return true;
  } catch {
    try {
      execSync('convert --version', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
}

async function getImageInfo(filePath: string): Promise<{ width: number; height: number; format: string }> {
  try {
    const output = execSync(`magick identify -format "%w %h %m" "${filePath}"`, { encoding: 'utf8' });
    const [width, height, format] = output.trim().split(' ');
    return {
      width: parseInt(width),
      height: parseInt(height),
      format: format.toLowerCase()
    };
  } catch {
    // Fallback for older ImageMagick versions
    const output = execSync(`identify -format "%w %h %m" "${filePath}"`, { encoding: 'utf8' });
    const [width, height, format] = output.trim().split(' ');
    return {
      width: parseInt(width),
      height: parseInt(height),
      format: format.toLowerCase()
    };
  }
}

async function optimizeImage(filePath: string): Promise<ImageStats> {
  const originalStats = await stat(filePath);
  const originalSize = originalStats.size;
  
  const imageInfo = await getImageInfo(filePath);
  
  // Determine if resizing is needed
  const needsResize = imageInfo.width > MAX_WIDTH;
  const scaleFactor = needsResize ? MAX_WIDTH / imageInfo.width : 1;
  const newHeight = Math.round(imageInfo.height * scaleFactor);
  
  // Use mogrify for in-place optimization
  let command: string;
  
  if (needsResize) {
    command = `magick mogrify -resize ${MAX_WIDTH}x${newHeight} -quality ${QUALITY} -define webp:method=6 -define webp:pass=10 -define webp:target-size=0 "${filePath}"`;
  } else {
    command = `magick mogrify -quality ${QUALITY} -define webp:method=6 -define webp:pass=10 -define webp:target-size=0 "${filePath}"`;
  }
  
  try {
    execSync(command);
    
    const optimizedStats = await stat(filePath);
    const optimizedSize = optimizedStats.size;
    const savings = originalSize - optimizedSize;
    const savingsPercent = (savings / originalSize) * 100;
    
    return {
      originalSize,
      optimizedSize,
      savings,
      savingsPercent
    };
  } catch (error) {
    console.error(`Error optimizing ${filePath}:`, error);
    throw error;
  }
}

async function main() {
  console.log('🖼️  Starting image optimization...\n');
  
  // Check if ImageMagick is available
  const hasImageMagick = await checkImageMagick();
  if (!hasImageMagick) {
    console.error('❌ ImageMagick is not installed or not in PATH');
    console.log('Please install ImageMagick: https://imagemagick.org/script/download.php');
    process.exit(1);
  }
  
  // Get all image files
  const files = await readdir(PRODUCTS_IMAGE_DIR);
  const imageFiles = files.filter(file => 
    /\.(jpg|jpeg|png|gif|bmp|tiff|webp)$/i.test(file)
  );
  
  if (imageFiles.length === 0) {
    console.log('No image files found in products directory');
    return;
  }
  
  console.log(`Found ${imageFiles.length} image(s) to optimize:\n`);
  
  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;
  let totalSavings = 0;
  
  for (const file of imageFiles) {
    const filePath = join(PRODUCTS_IMAGE_DIR, file);
    
    try {
      console.log(`Processing: ${file}`);
      
      const imageInfo = await getImageInfo(filePath);
      console.log(`  Original: ${imageInfo.width}x${imageInfo.height} (${imageInfo.format})`);
      
      const stats = await optimizeImage(filePath);
      
      const optimizedInfo = await getImageInfo(filePath);
      console.log(`  Optimized: ${optimizedInfo.width}x${optimizedInfo.height} (${optimizedInfo.format})`);
      console.log(`  Size: ${(stats.originalSize / 1024 / 1024).toFixed(2)}MB → ${(stats.optimizedSize / 1024 / 1024).toFixed(2)}MB`);
      console.log(`  Savings: ${(stats.savings / 1024 / 1024).toFixed(2)}MB (${stats.savingsPercent.toFixed(1)}%)\n`);
      
      totalOriginalSize += stats.originalSize;
      totalOptimizedSize += stats.optimizedSize;
      totalSavings += stats.savings;
      
    } catch (error) {
      console.error(`❌ Failed to optimize ${file}:`, error);
    }
  }
  
  // Summary
  console.log('📊 Optimization Summary:');
  console.log(`Total original size: ${(totalOriginalSize / 1024 / 1024).toFixed(2)}MB`);
  console.log(`Total optimized size: ${(totalOptimizedSize / 1024 / 1024).toFixed(2)}MB`);
  console.log(`Total savings: ${(totalSavings / 1024 / 1024).toFixed(2)}MB (${((totalSavings / totalOriginalSize) * 100).toFixed(1)}%)`);
  console.log('✅ Image optimization complete!');
}

main().catch(console.error);
