# Environment Management Setup Guide

This guide explains how to set up proper environment management for development and production environments in your Bela Bomberman store.

## 🎯 Overview

The new environment management system provides:
- **Automatic environment detection** based on `NODE_ENV`
- **Environment-specific configurations** for databases, API keys, and settings
- **Graceful fallbacks** to generic environment variables
- **Built-in validation** and health checks
- **Easy switching** between development and production

## 🏗️ Architecture

The system consists of:
1. **Environment Configuration** (`config/environments.ts`) - Centralized config management
2. **Enhanced Validation** (`src/lib/env-validation-v2.ts`) - Environment-aware validation
3. **Smart Database Config** (`src/lib/database/config-v2.ts`) - Environment-specific DB settings
4. **Management Scripts** (`scripts/env-switch.ts`) - CLI tools for environment management

## 📋 Quick Setup

### 1. Choose Your Approach

#### Option A: Environment-Specific Variables (Recommended)
Use different variables for each environment:
```bash
# Development
DATABASE_NAME_DEV=belabomberman_dev
NEXT_PUBLIC_SNIPCART_API_KEY_DEV=your_test_key

# Production  
DATABASE_NAME_PROD=belabomberman_prod
NEXT_PUBLIC_SNIPCART_API_KEY_PROD=your_live_key
```

#### Option B: Single Variables with Manual Switching
Use the same variable names and manually change values:
```bash
DATABASE_NAME=belabomberman_dev  # Change manually for each environment
NEXT_PUBLIC_SNIPCART_API_KEY=your_key  # Change manually for each environment
```

### 2. Create Your Environment File

Copy the example file:
```bash
cp env.local.example .env.local
```

Edit `.env.local` with your actual values following the chosen approach.

### 3. Set Up Separate Databases (Recommended)

#### Development Database
Create a separate database for development:
```sql
CREATE DATABASE belabomberman_dev;
CREATE USER dev_user WITH PASSWORD 'dev_password';
GRANT ALL PRIVILEGES ON DATABASE belabomberman_dev TO dev_user;
```

#### Production Database
Keep your existing production database or create a new one:
```sql
CREATE DATABASE belabomberman_prod;
-- Use your existing production credentials
```

### 4. Configure Snipcart Keys

#### Development (Test Mode)
Use your Snipcart test/development keys:
```bash
NEXT_PUBLIC_SNIPCART_API_KEY_DEV=test_abcd1234...
SNIPCART_SECRET_KEY_DEV=test_secret_key...
```

#### Production (Live Mode)
Use your Snipcart live/production keys:
```bash
NEXT_PUBLIC_SNIPCART_API_KEY_PROD=live_abcd1234...
SNIPCART_SECRET_KEY_PROD=live_secret_key...
```

## 🔧 Usage

### Running Environment Checks
Validate your environment setup:
```bash
npm run env:check
```

This will verify:
- ✅ All required environment variables are present
- ✅ Database connectivity
- ✅ Snipcart configuration matches environment
- ✅ SSL settings are appropriate

### Getting Setup Help
View the setup guide:
```bash
npm run env:guide
```

### Development Workflow
```bash
# Start development server (automatically uses development config)
NODE_ENV=development npm run dev

# Run database migrations in development
NODE_ENV=development npm run db:migrate

# Sync products in development environment
NODE_ENV=development npm run syncProducts
```

### Production Deployment

#### Local Production Testing
```bash
# Build and test production locally
NODE_ENV=production npm run build
NODE_ENV=production npm run start
```

#### Netlify Deployment
In your Netlify environment variables, set:
```bash
NODE_ENV=production

# Production database
DATABASE_HOST_PROD=your-prod-host
DATABASE_NAME_PROD=belabomberman_prod
DATABASE_USERNAME_PROD=your_prod_user
DATABASE_PASSWORD_PROD=your_prod_password
DATABASE_SSL_PROD=true

# Production Snipcart
NEXT_PUBLIC_SNIPCART_API_KEY_PROD=your_live_key
SNIPCART_SECRET_KEY_PROD=your_live_secret

# Shared variables
PRINTFUL_API_KEY=your_printful_key
JWT_SECRET=your_jwt_secret
ADMIN_PASSWORD=your_admin_password
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_name
```

## 🚀 Migration from Current Setup

### Step 1: Backup Current Configuration
Save your current environment variables before making changes.

### Step 2: Create Development Database
Set up a separate development database to avoid affecting production data.

### Step 3: Update Environment Variables

#### If using Option A (Environment-Specific):
```bash
# Rename your current variables
DATABASE_HOST → DATABASE_HOST_PROD
DATABASE_NAME → DATABASE_NAME_PROD
DATABASE_USERNAME → DATABASE_USERNAME_PROD
DATABASE_PASSWORD → DATABASE_PASSWORD_PROD
DATABASE_SSL → DATABASE_SSL_PROD

# Add development variables
DATABASE_HOST_DEV=localhost
DATABASE_NAME_DEV=belabomberman_dev
# ... etc
```

#### If using Option B (Single Variables):
Keep your current variable names, just ensure they're properly set.

### Step 4: Update Code References

Replace imports in your codebase:
```typescript
// Old
import { getEnv } from './env-validation';

// New
import { getEnv } from './env-validation-v2';
```

### Step 5: Test the Setup
```bash
npm run env:check
```

## 🔍 Troubleshooting

### Database Connection Issues
1. Check your database credentials
2. Ensure the database exists
3. Verify network connectivity
4. Check SSL requirements

### Snipcart Configuration Issues
1. Verify you're using the correct API keys for your environment
2. Check that test keys are used in development and live keys in production
3. Ensure webhook URLs are properly configured

### Environment Variable Issues
1. Check that all required variables are set
2. Verify variable names match exactly (including `_DEV` and `_PROD` suffixes)
3. Ensure `.env.local` is in your project root
4. Restart your development server after changing environment variables

## 📚 Advanced Configuration

### Custom Environment Detection
You can override environment detection:
```typescript
// Force a specific environment
process.env.NODE_ENV = 'production';
```

### Environment-Specific Features
The system automatically enables/disables features based on environment:
- **Development**: Debug logging, query logging, performance monitoring
- **Production**: Optimized for performance, minimal logging
- **Test**: Minimal features, fast execution

### Database Connection Optimization
Connection pools are automatically optimized:
- **Development**: 5 connections, longer timeouts
- **Production**: 20 connections, optimized timeouts

## 🎉 Benefits

1. **Safety**: Separate databases prevent development work from affecting production
2. **Convenience**: Automatic environment detection and configuration
3. **Visibility**: Built-in health checks and monitoring
4. **Flexibility**: Support for multiple configuration approaches
5. **Validation**: Comprehensive environment validation with helpful error messages

## 🔐 Security Best Practices

1. **Never commit** `.env.local` or any file containing secrets
2. **Use different passwords** for development and production databases
3. **Enable SSL** for production database connections
4. **Rotate keys regularly**, especially production Snipcart keys
5. **Use test mode** Snipcart keys for development

## 🤝 Team Collaboration

For team environments:
1. Share `env.local.example` with team members
2. Document any custom configuration requirements
3. Use environment-specific variables to ensure consistency
4. Set up development database access for all team members

This setup provides a robust, scalable foundation for managing multiple environments while maintaining security and ease of use.
