# Environment-Based Product Synchronization Guide

This guide explains how the product synchronization scripts work with different environments and how to safely manage synchronization between development and production databases.

## 🌍 Environment Configuration

### Environment Files
The sync scripts automatically detect and use the appropriate environment configuration:

- **`.env.local`** - Development environment (default)
- **`.env.production`** - Production environment
- **`.env`** - Fallback environment

### Environment Detection Logic
```typescript
// Load environment variables (defaults to .env.local, can be overridden)
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local';
config({ path: resolve(process.cwd(), envFile) });
```

## 🚀 Available Sync Commands

### 1. **Complete Sync** (Recommended for most cases)

#### Unix/Linux/macOS (bash/zsh)
```bash
# Development environment (default)
npm run sync:complete

# Production environment
NODE_ENV=production npm run sync:complete

# With dry-run (safe testing)
npm run sync:complete:dry

# Force deletion without double-checking
npm run sync:complete:force
```

#### Windows PowerShell
```powershell
# Development environment (default)
npm run sync:complete

# Production environment
$env:NODE_ENV="production"; npm run sync:complete

# With dry-run (safe testing)
npm run sync:complete:dry

# Force deletion without double-checking
npm run sync:complete:force
```

#### Windows Command Prompt (cmd)
```cmd
# Development environment (default)
npm run sync:complete

# Production environment
set NODE_ENV=production && npm run sync:complete

# With dry-run (safe testing)
npm run sync:complete:dry

# Force deletion without double-checking
npm run sync:complete:force
```

### 2. **Production Sync** (Production environment only)
```bash
# Production environment only
npm run sync:production
```

### 3. **Product Count Checker**

#### Unix/Linux/macOS (bash/zsh)
```bash
# Check counts in current environment
npm run check:counts

# Check counts in production
NODE_ENV=production npm run check:counts
```

#### Windows PowerShell
```powershell
# Check counts in current environment
npm run check:counts

# Check counts in production
$env:NODE_ENV="production"; npm run check:counts
```

#### Windows Command Prompt (cmd)
```cmd
# Check counts in current environment
npm run check:counts

# Check counts in production
set NODE_ENV=production && npm run check:counts
```

## 🔧 Environment-Specific Behavior

### Development Environment (`.env.local`)
- **Database**: Your local/development database
- **API Keys**: Development Printful store
- **Safety**: Full logging and error reporting
- **Use Case**: Testing sync logic, development work

### Production Environment (`.env.production`)
- **Database**: Your live production database
- **API Keys**: Production Printful store
- **Safety**: Enhanced error handling and rollback protection
- **Use Case**: Live store synchronization

## 🛡️ Safety Features by Environment

### Development Environment
```bash
npm run sync:complete:dry  # Safe testing
npm run sync:complete      # Full sync with detailed logging
```

**Features:**
- ✅ Detailed console output
- ✅ Full error stack traces
- ✅ Warning messages for all issues
- ✅ Safe for testing and development

### Production Environment
```bash
NODE_ENV=production npm run sync:complete  # Production-safe sync
npm run sync:production                   # Production-only script
```

**Features:**
- ✅ Enhanced error handling
- ✅ Automatic rollback on critical errors
- ✅ Progress tracking and logging
- ✅ Database transaction safety
- ✅ Reduced console verbosity for production logs

## 📊 Environment Switching Examples

### Switch to Production Environment

#### Unix/Linux/macOS (bash/zsh)
```bash
# Method 1: Set NODE_ENV
NODE_ENV=production npm run sync:complete

# Method 2: Use production-specific script
npm run sync:production

# Method 3: Check production counts
NODE_ENV=production npm run check:counts
```

#### Windows PowerShell
```powershell
# Method 1: Set NODE_ENV
$env:NODE_ENV="production"; npm run sync:complete

# Method 2: Use production-specific script
npm run sync:production

# Method 3: Check production counts
$env:NODE_ENV="production"; npm run check:counts
```

#### Windows Command Prompt (cmd)
```cmd
# Method 1: Set NODE_ENV
set NODE_ENV=production && npm run sync:complete

# Method 2: Use production-specific script
npm run sync:production

# Method 3: Check production counts
set NODE_ENV=production && npm run check:counts
```

### Switch to Development Environment

#### Unix/Linux/macOS (bash/zsh)
```bash
# Method 1: Default behavior
npm run sync:complete

# Method 2: Explicitly set development
NODE_ENV=development npm run sync:complete

# Method 3: Check development counts
npm run check:counts
```

#### Windows PowerShell
```powershell
# Method 1: Default behavior
npm run sync:complete

# Method 2: Explicitly set development
$env:NODE_ENV="development"; npm run sync:complete

# Method 3: Check development counts
npm run check:counts
```

#### Windows Command Prompt (cmd)
```cmd
# Method 1: Default behavior
npm run sync:complete

# Method 2: Explicitly set development
set NODE_ENV=development && npm run sync:complete

# Method 3: Check development counts
npm run check:counts
```

## 🔍 Dry Run Mode

Always test your sync operations with dry-run mode first:

#### Unix/Linux/macOS (bash/zsh)
```bash
# Test in development
npm run sync:complete:dry

# Test in production (without making changes)
NODE_ENV=production npm run sync:complete:dry
```

#### Windows PowerShell
```powershell
# Test in development
npm run sync:complete:dry

# Test in production (without making changes)
$env:NODE_ENV="production"; npm run sync:complete:dry
```

#### Windows Command Prompt (cmd)
```cmd
# Test in development
npm run sync:complete:dry

# Test in production (without making changes)
set NODE_ENV=production && npm run sync:complete:dry
```

**Dry Run Benefits:**
- ✅ No database changes made
- ✅ Full simulation of sync process
- ✅ Identifies what would be created/updated/deleted
- ✅ Safe for testing in any environment

## ⚠️ Production Safety Guidelines

### Before Running Production Sync
1. **Backup your database**
2. **Run dry-run first**: `NODE_ENV=production npm run sync:complete:dry`
3. **Verify the output** matches your expectations
4. **Check product counts**: `NODE_ENV=production npm run check:counts`

### Production Sync Commands

#### Unix/Linux/macOS (bash/zsh)
```bash
# Safe production sync with verification
NODE_ENV=production npm run sync:complete

# Production sync with force deletion (use with caution)
NODE_ENV=production npm run sync:complete:force

# Production-only script (most conservative)
npm run sync:production
```

#### Windows PowerShell
```powershell
# Safe production sync with verification
$env:NODE_ENV="production"; npm run sync:complete

# Production sync with force deletion (use with caution)
$env:NODE_ENV="production"; npm run sync:complete:force

# Production-only script (most conservative)
npm run sync:production
```

#### Windows Command Prompt (cmd)
```cmd
# Safe production sync with verification
set NODE_ENV=production && npm run sync:complete

# Production sync with force deletion (use with caution)
set NODE_ENV=production && npm run sync:complete:force

# Production-only script (most conservative)
npm run sync:production
```

## 🚨 Critical Safety Notes

### Environment Variables
- **NEVER** commit `.env.production` to version control
- **ALWAYS** verify `DATABASE_HOST` points to production before running
- **CONFIRM** `PRINTFUL_API_KEY` is for production store

### Database Safety
- **ALWAYS** backup before production sync
- **TEST** with dry-run first
- **MONITOR** sync progress in production
- **VERIFY** counts after sync completion

## 📋 Environment Checklist

### Development Environment
- [ ] `.env.local` file exists
- [ ] Development database credentials
- [ ] Development Printful API key
- [ ] Test with `npm run sync:complete:dry`

### Production Environment
- [ ] `.env.production` file exists
- [ ] Production database credentials
- [ ] Production Printful API key
- [ ] Database backup completed
- [ ] Test with `NODE_ENV=production npm run sync:complete:dry`
- [ ] Verify counts with `NODE_ENV=production npm run check:counts`

## 🔄 Typical Workflow

### Development Workflow
```bash
# 1. Test sync logic
npm run sync:complete:dry

# 2. Run full sync
npm run sync:complete

# 3. Verify results
npm run check:counts
```

### Production Workflow

#### Unix/Linux/macOS (bash/zsh)
```bash
# 1. Backup database
# 2. Test sync in production
NODE_ENV=production npm run sync:complete:dry

# 3. Run production sync
NODE_ENV=production npm run sync:complete

# 4. Verify production counts
NODE_ENV=production npm run check:counts
```

#### Windows PowerShell
```powershell
# 1. Backup database
# 2. Test sync in production
$env:NODE_ENV="production"; npm run sync:complete:dry

# 3. Run production sync
$env:NODE_ENV="production"; npm run sync:complete

# 4. Verify production counts
$env:NODE_ENV="production"; npm run check:counts
```

#### Windows Command Prompt (cmd)
```cmd
# 1. Backup database
# 2. Test sync in production
set NODE_ENV=production && npm run sync:complete:dry

# 3. Run production sync
set NODE_ENV=production && npm run sync:complete

# 4. Verify production counts
set NODE_ENV=production && npm run check:counts
```

## 🆘 Troubleshooting

### Common Environment Issues
```bash
# Wrong environment file
Error: Cannot find module '../src/lib/database/config'
Solution: Check NODE_ENV and environment file existence

# Wrong database
Error: Connection refused
Solution: Verify DATABASE_HOST in environment file

# Wrong API key
Error: Unauthorized
Solution: Check PRINTFUL_API_KEY in environment file
```

### Environment Verification

#### Unix/Linux/macOS (bash/zsh)
```bash
# Check current environment
echo $NODE_ENV

# Check which env file is loaded
npm run check:counts
# Look for "Environment: development" or "Environment: production" in output

# Verify database connection
npm run check:counts
# Should show database connection successful
```

#### Windows PowerShell
```powershell
# Check current environment
echo $env:NODE_ENV

# Check which env file is loaded
npm run check:counts
# Look for "Environment: development" or "Environment: production" in output

# Verify database connection
npm run check:counts
# Should show database connection successful
```

#### Windows Command Prompt (cmd)
```cmd
# Check current environment
echo %NODE_ENV%

# Check which env file is loaded
npm run check:counts
# Look for "Environment: development" or "Environment: production" in output

# Verify database connection
npm run check:counts
# Should show database connection successful
```

## 📚 Additional Resources

- [SYNC_SCRIPTS_GUIDE.md](./SYNC_SCRIPTS_GUIDE.md) - Detailed script documentation
- [ENVIRONMENT_SETUP_GUIDE.md](./ENVIRONMENT_SETUP_GUIDE.md) - Environment setup
- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - Database configuration

---

**Remember**: Always test with dry-run mode first, especially in production environments!
