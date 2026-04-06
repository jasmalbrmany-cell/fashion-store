import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  Megaphone,
  Globe,
  FileText,
  Activity,
  ChevronRight,
  LogOut,
  Menu,
  X,
  Store,
  DollarSign,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, canManageUsers, canManageProducts, canManageOrders } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { path: '/admin', icon: <LayoutDashboard className="w-5 h-5" />, label: 'لوحة التحكم', exact: true },
    { path: '/admin/products', icon: <Package className="w-5 h-5" />, label: 'المنتجات', show: canManageProducts },
    { path: '/admin/orders', icon: <ShoppingCart className="w-5 h-5" />, label: 'الطلبات', show: canManageOrders },
    { path: '/admin/users', icon: <Users className="w-5 h-5" />, label: 'المستخدمين', show: canManageUsers },
    { path: '/admin/cities', icon: <Globe className="w-5 h-5" />, label: 'المدن والشحن', show: canManageProducts },
    { path: '/admin/currencies', icon: <DollarSign className="w-5 h-5" />, label: 'العملات', show: canManageProducts },
    { path: '/admin/ads', icon: <Megaphone className="w-5 h-5" />, label: 'الإعلانات', show: canManageProducts },
    { path: '/admin/activity', icon: <Activity className="w-5 h-5" />, label: 'سجل النشاطات', show: true },
    { path: '/admin/settings', icon: <Settings className="w-5 h-5" />, label: 'الإعدادات', show: canManageUsers },
  ].filter(item => item.show !== false);

  const isActive = (path: string, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/admin" className="flex items-center gap-2">
            <Store className="w-6 h-6 text-primary-600" />
            <span className="font-bold text-gray-900">FashionHub</span>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-gray-600"
          >
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white shadow-lg">
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 py-5 border-b">
          <Store className="w-8 h-8 text-primary-600" />
          <span className="text-xl font-bold text-gray-900">FashionHub</span>
        </div>

        {/* User Info */}
        <div className="px-6 py-4 border-b">
          <p className="font-medium text-gray-900">{user?.name}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-primary-100 text-primary-700 rounded">
            {user?.role === 'admin' ? 'مدير' : user?.role === 'editor' ? 'محرر' : 'مشاهد'}
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    isActive(item.path, item.exact)
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom */}
        <div className="px-4 py-4 border-t">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 mb-2"
          >
            <Store className="w-5 h-5" />
            <span>العودة للمتجر</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-5 h-5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
            <div className="flex items-center justify-between px-6 py-5 border-b">
              <Link to="/admin" className="flex items-center gap-2">
                <Store className="w-8 h-8 text-primary-600" />
                <span className="text-xl font-bold text-gray-900">FashionHub</span>
              </Link>
            </div>

            <div className="px-6 py-4 border-b">
              <p className="font-medium text-gray-900">{user?.name}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>

            <nav className="px-4 py-4">
              <ul className="space-y-1">
                {menuItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                        isActive(item.path, item.exact)
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="absolute bottom-0 left-0 right-0 px-4 py-4 border-t">
              <Link
                to="/"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 mb-2"
              >
                <Store className="w-5 h-5" />
                <span>العودة للمتجر</span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-5 h-5" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="lg:mr-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
