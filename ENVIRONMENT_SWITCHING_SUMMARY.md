# Environment Switching Summary

## 🔄 How Environment Switching Works

The sync scripts automatically detect which environment to use based on the `NODE_ENV` environment variable:

### Default Behavior (Development)
```bash
npm run sync:complete
# Uses .env.local file
# Connects to development database
# Full logging and error reporting
```

### Production Environment

#### Unix/Linux/macOS (bash/zsh)
```bash
NODE_ENV=production npm run sync:complete
# Uses .env.production file
# Connects to production database
# Enhanced safety features
```

#### Windows PowerShell
```powershell
$env:NODE_ENV="production"; npm run sync:complete
# Uses .env.production file
# Connects to production database
# Enhanced safety features
```

#### Windows Command Prompt (cmd)
```cmd
set NODE_ENV=production && npm run sync:complete
# Uses .env.production file
# Connects to production database
# Enhanced safety features
```

## 📁 Environment File Priority

1. **`.env.production`** - When `NODE_ENV=production`
2. **`.env.local`** - Default (development)
3. **`.env`** - Fallback

## 🎯 Key Commands by Environment

### Development Commands
```bash
npm run check:counts              # Check development counts
npm run sync:complete:dry         # Test sync in development
npm run sync:complete             # Full sync in development
```

### Production Commands

#### Unix/Linux/macOS (bash/zsh)
```bash
NODE_ENV=production npm run check:counts      # Check production counts
NODE_ENV=production npm run sync:complete:dry # Test sync in production
NODE_ENV=production npm run sync:complete     # Full sync in production
npm run sync:production                        # Production-only script
```

#### Windows PowerShell
```powershell
$env:NODE_ENV="production"; npm run check:counts      # Check production counts
$env:NODE_ENV="production"; npm run sync:complete:dry # Test sync in production
$env:NODE_ENV="production"; npm run sync:complete     # Full sync in production
npm run sync:production                                # Production-only script
```

#### Windows Command Prompt (cmd)
```cmd
set NODE_ENV=production && npm run check:counts      # Check production counts
set NODE_ENV=production && npm run sync:complete:dry # Test sync in production
set NODE_ENV=production && npm run sync:complete     # Full sync in production
npm run sync:production                               # Production-only script
```

## 🛡️ Safety Features

### Development
- ✅ Full error details
- ✅ Verbose logging
- ✅ Safe for testing

### Production
- ✅ Enhanced error handling
- ✅ Database transaction safety
- ✅ Progress tracking
- ✅ Reduced console verbosity

## 🔍 Verification Commands

#### Unix/Linux/macOS (bash/zsh)
```bash
# Check which environment is active
echo $NODE_ENV

# Verify database connection
npm run check:counts

# Look for environment info in output:
# "Environment: development" or "Environment: production"
# "Database: [hostname]"
```

#### Windows PowerShell
```powershell
# Check which environment is active
echo $env:NODE_ENV

# Verify database connection
npm run check:counts

# Look for environment info in output:
# "Environment: development" or "Environment: production"
# "Database: [hostname]"
```

#### Windows Command Prompt (cmd)
```cmd
# Check which environment is active
echo %NODE_ENV%

# Verify database connection
npm run check:counts

# Look for environment info in output:
# "Environment: development" or "Environment: production"
# "Database: [hostname]"
```

## ⚠️ Important Notes

- **NEVER** commit `.env.production` to version control
- **ALWAYS** test with dry-run first in production
- **VERIFY** database host before running production sync
- **BACKUP** database before production operations

---

**Quick Reference**: Use `NODE_ENV=production` prefix for production operations, no prefix for development.
