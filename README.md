# Fashion Hub Store - Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Quick Start](#quick-start)
3. [Connecting to Supabase](#connecting-to-supabase)
4. [Database Schema](#database-schema)
5. [API Services](#api-services)
6. [Authentication](#authentication)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

---

## Project Overview

**Fashion Hub Store** is a modern e-commerce platform built with:
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Radix UI
- **State Management**: React Context + Hooks
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Features**: Product management, cart, orders, admin dashboard

### Key Features
- 📦 Product catalog with categories, sizes, and colors
- 🛒 Shopping cart with local storage persistence
- 📱 WhatsApp-based checkout system
- 📊 Admin dashboard for managing products, orders, and users
- 🔐 Role-based authentication (admin, editor, viewer, customer)
- 🌐 Multi-language support (RTL Arabic)

---

## Quick Start

### Demo Mode (No Server Required)

The app works in **demo mode** with mock data when Supabase is not configured.

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Build for production
pnpm build
```

**Demo Login Credentials:**
- Email: `admin@fashionhub.com`
- Password: `demo123`

---

## Connecting to Supabase

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Click **New Project**
3. Enter project details:
   - **Name**: `fashion-hub-store`
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to your users
4. Wait for the project to be created (~2 minutes)

### Step 2: Get API Credentials

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon/public key**: The long string starting with `eyJ...`

### Step 3: Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Copy the example file
cp .env.example .env

# Edit the .env file with your credentials
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 4: Set Up Database Schema

There are **two ways** to set up the database:

#### Option A: Using Supabase Dashboard (Recommended)

1. Go to **SQL Editor** in your Supabase project
2. Copy the contents of `supabase/schema.sql`
3. Paste and run the SQL query
4. Click **Run** to execute

#### Option B: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Initialize Supabase in your project
supabase init

# Link to your project
supabase link --project-ref your-project-id

# Push the schema
supabase db push
```

### Step 5: Create Admin User

After running the schema, create your admin user:

1. Go to **Authentication** → **Users** in Supabase Dashboard
2. Click **Add User**
3. Enter:
   - **Email**: `admin@fashionhub.com`
   - **Password**: Choose a secure password
   - **User Metadata**: `{"name": "أحمد محمد", "role": "admin"}`
4. Click **Create User**

### Step 6: Verify Connection

Restart your development server:

```bash
pnpm dev
```

If connected successfully, you should see:
- Products loaded from the database
- Login working with Supabase Auth
- Orders saved to the database

---

## Database Schema

### Tables Overview

| Table | Description |
|-------|-------------|
| `profiles` | User profiles (extends auth.users) |
| `categories` | Product categories |
| `products` | Products with images, sizes, colors |
| `cities` | Shipping cities with costs |
| `currencies` | Currency settings |
| `orders` | Customer orders |
| `ads` | Promotional banners |
| `activity_logs` | Admin activity tracking |
| `store_settings` | Store configuration |

### Row Level Security (RLS)

All tables have RLS enabled for security:
- **Public**: Categories, Cities, Currencies, Visible Products
- **Customer**: Own orders
- **Editor/Admin**: Full product and order management
- **Admin**: User management, settings, activity logs

### Database Functions

| Function | Purpose |
|----------|---------|
| `handle_new_user()` | Auto-creates profile on signup |
| `log_activity()` | Logs admin actions |
| `update_updated_at_column()` | Auto-updates timestamps |

---

## API Services

The project uses a service layer in `src/services/api.ts` that provides:

### Products Service
```typescript
// Get all visible products
const products = await productsService.getAll();

// Get by category
const womensClothing = await productsService.getByCategory('cat-1');

// Search products
const results = await productsService.search('فستان');

// Admin operations
await productsService.create(product);
await productsService.update(id, updates);
await productsService.delete(id);
await productsService.toggleVisibility(id);
```

### Orders Service
```typescript
// Get all orders
const orders = await ordersService.getAll();

// Get by status
const pendingOrders = await ordersService.getByStatus('pending');

// Create order
const newOrder = await ordersService.create({
  customerName: 'أحمد محمد',
  customerPhone: '777123456',
  city: 'صنعاء',
  items: [...],
  subtotal: 45000,
  shippingCost: 3000,
  total: 48000,
});

// Update status
await ordersService.updateStatus(orderId, 'approved');
```

### Other Services
- `categoriesService` - Category management
- `citiesService` - City/shipping management
- `currenciesService` - Currency settings
- `adsService` - Promotional ads
- `usersService` - User management
- `activityLogsService` - Activity tracking
- `storeSettingsService` - Store configuration
- `statisticsService` - Dashboard statistics

---

## Authentication

### How It Works

1. **Demo Mode** (no Supabase):
   - Uses mock users from `mockData.ts`
   - Accepts any email with password `demo123`
   - Session stored in localStorage

2. **Production Mode** (Supabase configured):
   - Uses Supabase Auth
   - Auto-creates profile on signup via database trigger
   - Session persisted by Supabase SDK

### Login Flow

```typescript
import { useAuth } from '@/context/AuthContext';

function LoginComponent() {
  const { login, logout, user, isAuthenticated } = useAuth();

  const handleLogin = async () => {
    const success = await login('user@example.com', 'password123');
    if (success) {
      // Redirect to dashboard
    }
  };

  return isAuthenticated ? (
    <button onClick={logout}>Logout</button>
  ) : (
    <button onClick={handleLogin}>Login</button>
  );
}
```

### Role-Based Access

| Role | Permissions |
|------|-------------|
| `admin` | Full access to all features |
| `editor` | Manage products, orders, ads |
| `viewer` | View-only access to admin |
| `customer` | Public access + own orders |

---

## Deployment

### Building for Production

```bash
# Create production build
pnpm build:prod

# Preview production build
pnpm preview
```

### Deploy to Vercel

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Add environment variables in Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

3. Deploy:
   ```bash
   vercel
   ```

### Deploy to Netlify

1. Add environment variables in Netlify UI
2. Connect your Git repository
3. Set build command: `pnpm build:prod`
4. Set publish directory: `dist`

### Environment Variables for Production

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_NAME=Fashion Hub
VITE_APP_URL=https://your-domain.com
```

---

## Troubleshooting

### Common Issues

#### 1. "placeholder.supabase.co" Error
**Cause**: Environment variables not set correctly

**Solution**:
```bash
# Make sure .env file exists and contains valid values
cat .env
# Should show:
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJ...

# Restart dev server
pnpm dev
```

#### 2. Authentication Not Working
**Cause**: RLS policy blocking access

**Solution**: Check that you're logged in and have the right permissions. Run the schema again if needed.

#### 3. Products Not Loading
**Cause**: Database tables empty

**Solution**: Run `supabase/schema.sql` in SQL Editor to seed sample data.

#### 4. Build Errors
**Cause**: TypeScript errors

**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm build
```

### Debug Mode

Enable debug logging by adding to your code:

```typescript
// In src/lib/supabase.ts
const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
  global: {
    headers: {
      'x-client-info': 'fashion-hub-store',
    },
  },
});
```

### Getting Help

If you encounter issues:
1. Check the browser console for errors
2. Verify Supabase credentials in `.env`
3. Check Supabase dashboard for database status
4. Review the schema SQL execution status

---

## Project Structure

```
fashion-hub-store/
├── src/
│   ├── components/      # React components
│   │   ├── Layout/     # Header, Footer, Layout
│   │   └── Product/    # Product cards
│   ├── context/        # React Context providers
│   │   ├── AuthContext.tsx
│   │   └── CartContext.tsx
│   ├── data/           # Mock data
│   │   └── mockData.ts
│   ├── lib/            # Utilities
│   │   └── supabase.ts # Supabase client
│   ├── pages/          # Page components
│   │   ├── admin/      # Admin pages
│   │   ├── CartPage.tsx
│   │   ├── CheckoutPage.tsx
│   │   └── ...
│   ├── services/       # API services
│   │   └── api.ts
│   ├── types/          # TypeScript types
│   │   ├── index.ts
│   │   └── database.ts
│   └── App.tsx         # Main app component
├── supabase/
│   └── schema.sql      # Database schema
├── .env.example        # Environment template
└── package.json
```

---

## License

This project is for educational and commercial use. Customize and deploy as needed!

---

## Support

For issues or questions:
- Create an issue on GitHub
- Check Supabase documentation: https://supabase.com/docs
- Review React documentation: https://react.dev
