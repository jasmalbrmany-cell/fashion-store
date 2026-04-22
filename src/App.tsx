import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { Layout } from '@/components/Layout';
import CartDrawer from '@/components/Cart/CartDrawer';
import ToastProvider, { ToastContainer } from '@/components/Common/Toast';
import ProtectedRoute from '@/components/Common/ProtectedRoute';

// Lazy load pages for performance
const HomePage = lazy(() => import('@/pages/HomePage'));
const ProductsPage = lazy(() => import('@/pages/ProductsPage'));
const ProductDetailPage = lazy(() => import('@/pages/ProductDetailPage'));
const CartPage = lazy(() => import('@/pages/CartPage'));
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const OrderSuccessPage = lazy(() => import('@/pages/OrderSuccessPage'));
const TrackOrderPage = lazy(() => import('@/pages/TrackOrderPage'));
const MyOrdersPage = lazy(() => import('@/pages/MyOrdersPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));

// Admin Pages (Loaded only when needed)
const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout'));
const DashboardPage = lazy(() => import('@/pages/admin/DashboardPage'));
const AdminProductsPage = lazy(() => import('@/pages/admin/ProductsPage'));
const AddProductPage = lazy(() => import('@/pages/admin/AddProductPage'));
const StoreImportPage = lazy(() => import('@/pages/admin/StoreImportPage'));
const AdminOrdersPage = lazy(() => import('@/pages/admin/OrdersPage'));
const UsersPage = lazy(() => import('@/pages/admin/UsersPage'));
const ActivityPage = lazy(() => import('@/pages/admin/ActivityPage'));
const SettingsPage = lazy(() => import('@/pages/admin/SettingsPage'));
const AdsPage = lazy(() => import('@/pages/admin/AdsPage'));
const CitiesPage = lazy(() => import('@/pages/admin/CitiesPage'));
const CurrenciesPage = lazy(() => import('@/pages/admin/CurrenciesPage'));
const CategoriesPage = lazy(() => import('@/pages/admin/CategoriesPage'));
const ExternalStoresPage = lazy(() => import('@/pages/admin/ExternalStoresPage'));
const ScrapingRulesPage = lazy(() => import('@/pages/admin/ScrapingRulesPage'));
const CategoriesExplorerPage = lazy(() => import('@/pages/CategoriesExplorerPage'));

const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <LanguageProvider>
          <ThemeProvider>
            <AuthProvider>
              <CartProvider>
                <NotificationProvider>
                  <ToastContainer />
                  <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* صفحات المتجر العام */}
                    <Route path="/" element={<Layout />}>
                      <Route index element={<HomePage />} />
                      <Route path="products" element={<ProductsPage />} />
                      <Route path="categories" element={<CategoriesExplorerPage />} />
                      <Route path="product/:id" element={<ProductDetailPage />} />
                      <Route path="cart" element={<CartPage />} />
                      <Route path="checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
                      <Route path="order-success" element={<OrderSuccessPage />} />
                      <Route path="track-order" element={<TrackOrderPage />} />
                      <Route path="my-orders" element={<ProtectedRoute><MyOrdersPage /></ProtectedRoute>} />
                      <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                      <Route path="login" element={<LoginPage />} />
                      <Route path="register" element={<RegisterPage />} />
                    </Route>

                    {/* صفحات لوحة التحكم */}
                    <Route path="/admin" element={<AdminLayout />}>
                      <Route index element={<DashboardPage />} />
                      <Route path="products" element={<AdminProductsPage />} />
                      <Route path="products/add" element={<AddProductPage />} />
                      <Route path="products/edit/:id" element={<AddProductPage />} />
                      <Route path="products/store" element={<StoreImportPage />} />
                      <Route path="orders" element={<AdminOrdersPage />} />
                      <Route path="users" element={<UsersPage />} />
                      <Route path="activity" element={<ActivityPage />} />
                      <Route path="settings" element={<SettingsPage />} />
                      <Route path="ads" element={<AdsPage />} />
                      <Route path="cities" element={<CitiesPage />} />
                      <Route path="currencies" element={<CurrenciesPage />} />
                      <Route path="categories" element={<CategoriesPage />} />
                      <Route path="products/connections" element={<ExternalStoresPage />} />
                      <Route path="api-mappings" element={<ScrapingRulesPage />} />
                      <Route path="profile" element={<ProfilePage />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                  </Suspense>
                  <CartDrawer />
                </NotificationProvider>
              </CartProvider>
            </AuthProvider>
          </ThemeProvider>
        </LanguageProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
