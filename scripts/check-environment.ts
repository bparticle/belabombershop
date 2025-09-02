#!/usr/bin/env tsx

/**
 * ENVIRONMENT CHECK SCRIPT
 * 
 * This script checks your environment setup without requiring database connections.
 * It will help us identify what environment files exist and what variables are missing.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync, readFileSync } from 'fs';

console.log('🔍 ENVIRONMENT CHECK SCRIPT');
console.log('=' .repeat(50));
console.log(`📅 Started at: ${new Date().toISOString()}`);
console.log(`📁 Working directory: ${process.cwd()}`);
console.log('=' .repeat(50));

// Check for environment files
const envFiles = [
  '.env',
  '.env.local',
  '.env.development',
  '.env.production',
  'env.local',
  'env.production'
];

console.log('\n1️⃣ Checking for environment files...');
const foundEnvFiles = [];

for (const envFile of envFiles) {
  const fullPath = resolve(process.cwd(), envFile);
  if (existsSync(fullPath)) {
    foundEnvFiles.push(envFile);
    console.log(`✅ Found: ${envFile}`);
    
    // Try to read and count variables (without logging values for security)
    try {
      const content = readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      const variables = lines.filter(line => line.includes('=') && !line.startsWith('#')).length;
      console.log(`   📊 Contains ${variables} environment variables`);
    } catch (error) {
      console.log(`   ❌ Could not read file: ${error}`);
    }
  } else {
    console.log(`❌ Missing: ${envFile}`);
  }
}

if (foundEnvFiles.length === 0) {
  console.log('\n🚨 NO ENVIRONMENT FILES FOUND!');
  console.log('This is the root cause of your sync issues.');
  console.log('\n📋 IMMEDIATE ACTIONS REQUIRED:');
  console.log('1. You need to create environment files with your credentials');
  console.log('2. Copy env.local.example to .env.local (note the dot!)');
  console.log('3. Fill in your actual credentials');
  console.log('\nRun these commands:');
  console.log('   copy env.local.example .env.local');
  console.log('   copy env.local.example .env.production');
  console.log('   # Then edit both files with your actual credentials');
  process.exit(0);
}

// Load environment variables from found files
console.log('\n2️⃣ Loading environment variables...');
for (const envFile of foundEnvFiles) {
  try {
    config({ path: resolve(process.cwd(), envFile) });
    console.log(`✅ Loaded: ${envFile}`);
  } catch (error) {
    console.log(`❌ Failed to load ${envFile}: ${error}`);
  }
}

// Check required variables
console.log('\n3️⃣ Checking required environment variables...');
const requiredVars = [
  'PRINTFUL_API_KEY',
  'NODE_ENV',
  'JWT_SECRET',
  'DATABASE_HOST',
  'DATABASE_NAME',
  'DATABASE_USERNAME',
  'DATABASE_PASSWORD',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

const missingVars = [];
const presentVars = [];

for (const varName of requiredVars) {
  const value = process.env[varName];
  if (!value || value.trim() === '') {
    missingVars.push(varName);
    console.log(`❌ Missing: ${varName}`);
  } else {
    presentVars.push(varName);
    // Show first few characters for verification (security safe)
    const preview = value.length > 8 ? value.substring(0, 8) + '...' : '[short]';
    console.log(`✅ Present: ${varName} = ${preview}`);
  }
}

// Summary and recommendations
console.log('\n' + '=' .repeat(50));
console.log('📊 ENVIRONMENT CHECK SUMMARY');
console.log('=' .repeat(50));
console.log(`✅ Environment files found: ${foundEnvFiles.length}`);
console.log(`✅ Variables present: ${presentVars.length}`);
console.log(`❌ Variables missing: ${missingVars.length}`);

if (missingVars.length === 0) {
  console.log('\n🎉 ALL ENVIRONMENT VARIABLES ARE PRESENT!');
  console.log('Your environment is properly configured.');
  console.log('\n📋 Next steps:');
  console.log('1. Try running the sync diagnostic: npm run sync:diagnostic');
  console.log('2. If that fails, check your database connectivity');
} else {
  console.log('\n🚨 MISSING ENVIRONMENT VARIABLES!');
  console.log('This is why your sync is failing.');
  console.log('\n❌ Missing variables:');
  missingVars.forEach(varName => console.log(`   - ${varName}`));
  
  console.log('\n📋 REQUIRED ACTIONS:');
  
  if (foundEnvFiles.length === 0) {
    console.log('1. CREATE environment files:');
    console.log('   copy env.local.example .env.local');
    console.log('   copy env.local.example .env.production');
  } else {
    console.log(`1. EDIT your environment file(s): ${foundEnvFiles.join(', ')}`);
  }
  
  console.log('2. ADD the missing variables with your actual credentials');
  console.log('3. For Netlify deployment, also add these variables to:');
  console.log('   Netlify Dashboard > Site Settings > Environment Variables');
  
  console.log('\n💡 HINTS:');
  console.log('- PRINTFUL_API_KEY: Get from Printful dashboard');
  console.log('- DATABASE_*: Your database connection details');
  console.log('- JWT_SECRET: Any random secure string (32+ characters)');
  console.log('- CLOUDINARY_*: Get from Cloudinary dashboard');
  console.log('- NODE_ENV: Set to "development" for local, "production" for Netlify');
}

console.log('\n🔍 DEBUGGING INFO:');
console.log(`Current NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
console.log(`Process platform: ${process.platform}`);
console.log(`Node version: ${process.version}`);

console.log('\n' + '=' .repeat(50));
console.log('📁 ENVIRONMENT CHECK COMPLETE');
console.log('=' .repeat(50));
