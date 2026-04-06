import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { Layout } from '@/components/Layout';

// Pages
import HomePage from '@/pages/HomePage';
import ProductsPage from '@/pages/ProductsPage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import CartPage from '@/pages/CartPage';
import CheckoutPage from '@/pages/CheckoutPage';
import LoginPage from '@/pages/LoginPage';
import OrderSuccessPage from '@/pages/OrderSuccessPage';
import TrackOrderPage from '@/pages/TrackOrderPage';

// Admin Pages
import { AdminLayout, DashboardPage, AdminProductsPage, ImportProductPage, AdminOrdersPage, UsersPage, ActivityPage, SettingsPage, AdsPage, CitiesPage, CurrenciesPage } from '@/pages/admin';
import AddProductPage from '@/pages/admin/AddProductPage';

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <Routes>
              {/* صفحات المتجر العام */}
              <Route path="/" element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="products" element={<ProductsPage />} />
                <Route path="product/:id" element={<ProductDetailPage />} />
                <Route path="cart" element={<CartPage />} />
                <Route path="checkout" element={<CheckoutPage />} />
                <Route path="order-success" element={<OrderSuccessPage />} />
                <Route path="track-order" element={<TrackOrderPage />} />
                <Route path="login" element={<LoginPage />} />
              </Route>

              {/* صفحات لوحة التحكم */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="products" element={<AdminProductsPage />} />
                <Route path="products/add" element={<AddProductPage />} />
                <Route path="products/import" element={<ImportProductPage />} />
                <Route path="orders" element={<AdminOrdersPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="activity" element={<ActivityPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="ads" element={<AdsPage />} />
                <Route path="cities" element={<CitiesPage />} />
                <Route path="currencies" element={<CurrenciesPage />} />
              </Route>

              {/* التقاط أي مسار غير موجود */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;
