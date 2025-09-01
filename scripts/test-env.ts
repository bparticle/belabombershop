import { config } from 'dotenv';

// Load environment variables
config();

function testEnvironmentVariables() {
  console.log('🔍 Testing Environment Variables...\n');

  // Required Cloudinary variables
  const cloudinaryVars = {
    'CLOUDINARY_CLOUD_NAME': process.env.CLOUDINARY_CLOUD_NAME,
    'CLOUDINARY_API_KEY': process.env.CLOUDINARY_API_KEY,
    'CLOUDINARY_API_SECRET': process.env.CLOUDINARY_API_SECRET,
  };

  // Required Admin authentication variables
  const adminVars = {
    'ADMIN_PASSWORD': process.env.ADMIN_PASSWORD,
    'JWT_SECRET': process.env.JWT_SECRET,
  };

  // Optional but recommended variables
  const optionalVars = {
    'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME': process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    'DATABASE_URL': process.env.DATABASE_URL,
  };

  console.log('📋 Cloudinary Variables:');
  let cloudinaryOk = true;
  Object.entries(cloudinaryVars).forEach(([key, value]) => {
    const status = value ? '✅ Set' : '❌ Missing';
    console.log(`  ${key}: ${status}`);
    if (!value) cloudinaryOk = false;
  });

  console.log('\n🔐 Admin Authentication Variables:');
  let adminOk = true;
  Object.entries(adminVars).forEach(([key, value]) => {
    const status = value ? '✅ Set' : '❌ Missing';
    console.log(`  ${key}: ${status}`);
    if (!value) adminOk = false;
  });

  console.log('\n📝 Optional Variables:');
  Object.entries(optionalVars).forEach(([key, value]) => {
    const status = value ? '✅ Set' : '⚠️  Not Set';
    console.log(`  ${key}: ${status}`);
  });

  console.log('\n📊 Summary:');
  if (cloudinaryOk && adminOk) {
    console.log('🎉 All required environment variables are set!');
    console.log('\n📝 Next steps:');
    console.log('1. Restart your development server');
    console.log('2. Try logging into the admin panel');
    console.log('3. Test Cloudinary upload functionality');
  } else {
    console.log('❌ Some required environment variables are missing!');
    console.log('\n🔧 To fix this:');
    
    if (!cloudinaryOk) {
      console.log('\n📸 For Cloudinary:');
      console.log('   Add these to your .env file:');
      console.log('   CLOUDINARY_CLOUD_NAME=your_cloud_name');
      console.log('   CLOUDINARY_API_KEY=your_api_key');
      console.log('   CLOUDINARY_API_SECRET=your_api_secret');
      console.log('   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name');
    }
    
    if (!adminOk) {
      console.log('\n🔐 For Admin Authentication:');
      console.log('   Add these to your .env file:');
      console.log('   ADMIN_PASSWORD=your_admin_password');
      console.log('   JWT_SECRET=your_jwt_secret_key');
    }
    
    console.log('\n💡 After updating .env, restart your development server!');
  }

  // Check if .env file exists
  console.log('\n📁 .env File Check:');
  try {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(process.cwd(), '.env');
    
    if (fs.existsSync(envPath)) {
      console.log('✅ .env file found in project root');
      
      // Check file size
      const stats = fs.statSync(envPath);
      console.log(`   File size: ${stats.size} bytes`);
      
      // Check if file has content
      if (stats.size === 0) {
        console.log('⚠️  Warning: .env file is empty!');
      }
    } else {
      console.log('❌ .env file not found in project root');
      console.log('   Expected location: ' + envPath);
    }
  } catch (error) {
    console.log('⚠️  Could not check .env file:', error);
  }
}

// Run the test
testEnvironmentVariables();
