import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  Megaphone,
  Globe,
  Activity,
  LogOut,
  Menu,
  X,
  Store,
  DollarSign,
  Languages
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading, logout, canManageUsers, canManageProducts, canManageOrders } = useAuth();
  const { t, language, toggleLanguage, isRTL } = useLanguage();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate('/login', { state: { from: location } });
      } else if (user.role === 'customer') {
        navigate('/');
      }
    }
  }, [user, isLoading, navigate, location]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || user.role === 'customer') {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { path: '/admin', icon: <LayoutDashboard className="w-5 h-5" />, label: t.adminDashboard, exact: true },
    { path: '/admin/products', icon: <Package className="w-5 h-5" />, label: t.adminProducts, show: canManageProducts },
    { path: '/admin/orders', icon: <ShoppingCart className="w-5 h-5" />, label: t.adminOrders, show: canManageOrders },
    { path: '/admin/users', icon: <Users className="w-5 h-5" />, label: t.adminUsers, show: canManageUsers },
    { path: '/admin/cities', icon: <Globe className="w-5 h-5" />, label: t.adminCities, show: canManageProducts },
    { path: '/admin/currencies', icon: <DollarSign className="w-5 h-5" />, label: t.adminCurrencies, show: canManageProducts },
    { path: '/admin/ads', icon: <Megaphone className="w-5 h-5" />, label: t.adminAds, show: canManageProducts },
    { path: '/admin/activity', icon: <Activity className="w-5 h-5" />, label: t.adminActivity, show: true },
    { path: '/admin/settings', icon: <Settings className="w-5 h-5" />, label: t.adminSettings, show: canManageUsers },
    { path: '/admin/products/bulk', icon: <ShoppingCart className="w-5 h-5" />, label: t.bulkImport, show: canManageProducts },
  ].filter(item => item.show !== false);

  const isActive = (path: string, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-100" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm fixed top-0 left-0 right-0 z-40 h-16 flex items-center px-4 justify-between">
        <Link to="/admin" className="flex items-center gap-2">
          <Store className="w-6 h-6 text-black" />
          <span className="font-bold text-gray-900 leading-none">FashionHub</span>
        </Link>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar - Desktop */}
      <aside className={`hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white shadow-xl ${isRTL ? 'lg:right-0 lg:border-l' : 'lg:left-0 lg:border-r'}`}>
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 py-6 border-b">
          <Store className="w-8 h-8 text-black" />
          <span className="text-xl font-bold text-gray-900">FashionHub</span>
        </div>

        {/* User Info */}
        <div className="px-6 py-5 border-b bg-gray-50/50">
          <p className="font-bold text-gray-900 truncate">{user?.name}</p>
          <p className="text-sm text-gray-500 truncate">{user?.email}</p>
          <span className="inline-block mt-2 text-[10px] font-bold px-2.5 py-1 bg-black text-white rounded-full uppercase tracking-wider">
            {user?.role === 'admin' ? t.adminRole : user?.role === 'editor' ? t.editorRole : t.viewerRole}
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 overflow-y-auto space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive(item.path, item.exact)
                  ? 'bg-black text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className={isActive(item.path, item.exact) ? 'text-white' : 'text-gray-400 group-hover:text-black transition-colors'}>
                {item.icon}
              </div>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-4 py-6 border-t space-y-2">
          <button
            onClick={toggleLanguage}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Languages className="w-5 h-5 text-gray-400" />
            <span className="font-medium">{language === 'ar' ? 'English (EN)' : 'العربية (AR)'}</span>
          </button>
          
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Store className="w-5 h-5 text-gray-400" />
            <span className="font-medium">{t.backToStore}</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">{t.logout}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
          <nav className={`fixed inset-y-0 ${isRTL ? 'right-0' : 'left-0'} w-72 bg-white shadow-2xl flex flex-col p-4 animate-in slide-in-from-${isRTL ? 'right' : 'left'} duration-300`}>
            <div className="flex items-center justify-between mb-8 px-2">
              <div className="flex items-center gap-2">
                <Store className="w-8 h-8 text-black" />
                <span className="text-xl font-bold text-gray-900">FashionHub</span>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="px-2 py-4 mb-6 bg-gray-50 rounded-2xl mx-2">
              <p className="font-bold text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 bg-black text-white rounded">
                {(user?.role === 'admin' ? t.adminRole : user?.role === 'editor' ? t.editorRole : t.viewerRole).toUpperCase()}
              </span>
            </div>

            <div className="flex-1 space-y-1 overflow-y-auto px-2">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                    isActive(item.path, item.exact)
                      ? 'bg-black text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </div>

            <div className="pt-4 border-t space-y-1 px-2">
              <button
                onClick={toggleLanguage}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50"
              >
                <Languages className="w-5 h-5 text-gray-400" />
                <span className="font-medium">{language === 'ar' ? 'English (EN)' : 'العربية (AR)'}</span>
              </button>
              <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50">
                <Store className="w-5 h-5 text-gray-400" />
                <span className="font-medium">{t.backToStore}</span>
              </Link>
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50">
                <LogOut className="w-5 h-5" />
                <span className="font-medium">{t.logout}</span>
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className={`transition-all duration-300 ${isRTL ? 'lg:mr-64' : 'lg:ml-64'} pt-16 lg:pt-0 min-h-screen relative`}>
        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
