# Admin Authentication Setup

This project uses a simple environment variable-based authentication system for the admin interface.

## Setup Instructions

### 1. Environment Variables

Add these variables to your `.env.local` file:

```bash
# Admin Authentication
ADMIN_PASSWORD=your_secure_admin_password_here
JWT_SECRET=your_jwt_secret_key_here
```

**Important Security Notes:**
- Use a strong, unique password for `ADMIN_PASSWORD`
- Use a long, random string for `JWT_SECRET` (you can generate one with: `openssl rand -base64 32`)
- Never commit these values to version control

### 2. Accessing the Admin Interface

1. Navigate to `/admin/login` in your browser
2. Enter the password you set in `ADMIN_PASSWORD`
3. You'll be redirected to the admin dashboard
4. Your session will last for 24 hours

### 3. Security Features

- **JWT Tokens**: Secure, time-limited authentication tokens
- **24-hour Sessions**: Automatic logout after 24 hours
- **Route Protection**: All admin routes are protected
- **API Protection**: All admin API endpoints require authentication
- **Secure Headers**: Uses Bearer token authentication

### 4. Logout

- Click the "Logout" button in the admin interface
- This will clear your session and redirect you to the login page

### 5. File Structure

```
src/
├── pages/
│   ├── admin/
│   │   ├── login.tsx          # Login page
│   │   ├── index.tsx          # Admin dashboard
│   │   └── enhancements.tsx   # Enhancement management
│   └── api/admin/
│       ├── auth.ts            # Authentication endpoint
│       ├── products.ts        # Products API (protected)
│       └── enhancements.ts    # Enhancements API (protected)
├── lib/
│   └── auth.ts               # Authentication utilities
└── middleware.ts             # Route protection middleware
```

### 6. How It Works

1. **Login**: User enters password → validated against `ADMIN_PASSWORD` → JWT token generated
2. **Session**: Token stored in localStorage and cookie → used for all admin requests
3. **Protection**: Middleware checks token on all admin routes → redirects to login if invalid
4. **API Calls**: All admin API endpoints verify the JWT token before processing requests

### 7. Troubleshooting

**"Unauthorized" errors:**
- Check that `ADMIN_PASSWORD` is set correctly
- Ensure `JWT_SECRET` is set and consistent
- Clear browser storage and try logging in again

**Login page not loading:**
- Check that the environment variables are loaded
- Restart the development server after adding environment variables

**Token expiration:**
- Simply log in again - tokens expire after 24 hours for security
