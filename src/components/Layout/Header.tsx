import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, User, Heart, Menu, X, LayoutDashboard, Store, Languages } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getItemCount } = useCart();
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const isAdminPage = location.pathname.startsWith('/admin');
  const cartCount = getItemCount();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-black via-gray-900 to-black text-white">
        <div className="container mx-auto px-4 py-2.5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4 text-sm">
              <a href={`https://wa.me/967777123456`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-green-400 transition">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                <span className="hidden sm:inline">{t.contactUs}</span>
              </a>
            </div>
            <div className="flex items-center gap-3">
              {/* زر تبديل اللغة */}
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition"
                title={language === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
              >
                <Languages className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'EN' : 'عر'}</span>
              </button>
              <span className="hidden sm:inline text-gray-300">|</span>
              <Link to="/track-order" className="text-sm hover:text-gray-300 transition">
                {t.trackOrder}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src="/logo.jpg" alt="Fashion Hub" className="h-14 md:h-16 w-auto" />
          </Link>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-xl mx-6">
            <div className="relative w-full">
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-5 py-2.5 pr-12 bg-gray-100 border-0 rounded-full focus:ring-2 focus:ring-black focus:bg-white transition-all"
              />
              <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black transition">
                <Search className="w-5 h-5" />
              </button>
            </div>
          </form>

          {/* Icons */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Admin Toggle */}
            {isAuthenticated && isAdmin && (
              <Link
                to={isAdminPage ? "/" : "/admin"}
                className="hidden sm:flex items-center gap-2 px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition text-sm"
              >
                {isAdminPage ? (
                  <>
                    <Store className="w-4 h-4" />
                    <span>{t.store}</span>
                  </>
                ) : (
                  <>
                    <LayoutDashboard className="w-4 h-4" />
                    <span>{t.dashboard}</span>
                  </>
                )}
              </Link>
            )}

            {/* Favorites - Desktop */}
            <Link to="/favorites" className="hidden md:flex flex-col items-center text-gray-700 hover:text-black transition">
              <Heart className="w-6 h-6" />
              <span className="text-xs mt-0.5">{t.favorites}</span>
            </Link>

            {/* Cart */}
            <Link to="/cart" className="relative flex flex-col items-center text-gray-700 hover:text-black transition">
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">
                  {cartCount}
                </span>
              )}
              <span className="text-xs mt-0.5 hidden md:block">{t.cart}</span>
            </Link>

            {/* User */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex flex-col items-center text-gray-700 hover:text-black transition"
                >
                  <div className="w-7 h-7 bg-black rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs mt-0.5 hidden md:block max-w-[60px] truncate">{user?.name}</span>
                </button>

                {isUserMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                    <div className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border z-50 overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b">
                        <p className="font-semibold text-gray-900">{user?.name}</p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                        <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-black text-white rounded">
                          {user?.role === 'admin' ? t.adminRole : user?.role === 'editor' ? t.editorRole : t.viewerRole}
                        </span>
                      </div>
                      <Link to="/my-orders" className="block px-4 py-2.5 hover:bg-gray-100 transition" onClick={() => setIsUserMenuOpen(false)}>
                        {t.myOrders}
                      </Link>
                      {(user?.role === 'admin' || user?.role === 'editor' || user?.role === 'viewer') && (
                        <Link to="/admin" className="block px-4 py-2.5 hover:bg-gray-100 transition" onClick={() => setIsUserMenuOpen(false)}>
                          {t.dashboard}
                        </Link>
                      )}
                      <button onClick={() => { logout(); setIsUserMenuOpen(false); }} className="w-full text-right px-4 py-2.5 hover:bg-red-50 text-red-600 transition">
                        {t.logout}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link to="/register" className="flex flex-col items-center text-gray-700 hover:text-black transition">
                <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <span className="text-xs mt-0.5 hidden md:block">{t.loginRegister}</span>
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-2 text-gray-700">
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <form onSubmit={handleSearch} className="lg:hidden mt-4">
          <div className="relative">
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 pr-12 bg-gray-100 border-0 rounded-full focus:ring-2 focus:ring-black focus:bg-white transition-all"
            />
            <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              <Search className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>

      {/* Categories Nav - Desktop */}
      <nav className="hidden lg:block bg-black text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-1 py-2 overflow-x-auto">
            <Link to="/products" className="px-4 py-2 hover:bg-white hover:text-black rounded-lg whitespace-nowrap transition font-medium">
              {t.allProducts}
            </Link>
            <Link to="/products?category=cat-1" className="px-4 py-2 hover:bg-white hover:text-black rounded-lg whitespace-nowrap transition">
              {t.womenClothes}
            </Link>
            <Link to="/products?category=cat-2" className="px-4 py-2 hover:bg-white hover:text-black rounded-lg whitespace-nowrap transition">
              {t.menClothes}
            </Link>
            <Link to="/products?category=cat-3" className="px-4 py-2 hover:bg-white hover:text-black rounded-lg whitespace-nowrap transition">
              {t.shoes}
            </Link>
            <Link to="/products?category=cat-4" className="px-4 py-2 hover:bg-white hover:text-black rounded-lg whitespace-nowrap transition">
              {t.accessories}
            </Link>
            <Link to="/products?category=cat-5" className="px-4 py-2 hover:bg-white hover:text-black rounded-lg whitespace-nowrap transition">
              {t.bags}
            </Link>
            <Link to="/products?category=cat-6" className="px-4 py-2 hover:bg-white hover:text-black rounded-lg whitespace-nowrap transition">
              {t.perfumes}
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t">
          <nav className="container mx-auto px-4 py-4">
            {/* Admin Toggle Mobile */}
            {isAuthenticated && isAdmin && (
              <Link
                to={isAdminPage ? "/" : "/admin"}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 bg-black text-white rounded-lg mb-4"
              >
                {isAdminPage ? (
                  <>
                    <Store className="w-5 h-5" />
                    <span>{t.store}</span>
                  </>
                ) : (
                  <>
                    <LayoutDashboard className="w-5 h-5" />
                    <span>{t.dashboard}</span>
                  </>
                )}
              </Link>
            )}

            <div className="flex flex-col gap-1">
              <Link to="/products" className="py-3 px-4 text-gray-800 hover:bg-gray-100 rounded-lg font-medium transition" onClick={() => setIsMobileMenuOpen(false)}>
                {t.allProducts}
              </Link>
              <Link to="/products?category=cat-1" className="py-3 px-4 text-gray-700 hover:bg-gray-100 rounded-lg transition" onClick={() => setIsMobileMenuOpen(false)}>
                {t.womenClothes}
              </Link>
              <Link to="/products?category=cat-2" className="py-3 px-4 text-gray-700 hover:bg-gray-100 rounded-lg transition" onClick={() => setIsMobileMenuOpen(false)}>
                {t.menClothes}
              </Link>
              <Link to="/products?category=cat-3" className="py-3 px-4 text-gray-700 hover:bg-gray-100 rounded-lg transition" onClick={() => setIsMobileMenuOpen(false)}>
                {t.shoes}
              </Link>
              <Link to="/products?category=cat-4" className="py-3 px-4 text-gray-700 hover:bg-gray-100 rounded-lg transition" onClick={() => setIsMobileMenuOpen(false)}>
                {t.accessories}
              </Link>
              <Link to="/products?category=cat-5" className="py-3 px-4 text-gray-700 hover:bg-gray-100 rounded-lg transition" onClick={() => setIsMobileMenuOpen(false)}>
                {t.bags}
              </Link>
              <Link to="/products?category=cat-6" className="py-3 px-4 text-gray-700 hover:bg-gray-100 rounded-lg transition" onClick={() => setIsMobileMenuOpen(false)}>
                {t.perfumes}
              </Link>
              <hr className="my-3" />
              <Link to="/favorites" className="py-3 px-4 text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-3 transition" onClick={() => setIsMobileMenuOpen(false)}>
                <Heart className="w-5 h-5" /> {t.favorites}
              </Link>
              <Link to="/track-order" className="py-3 px-4 text-gray-700 hover:bg-gray-100 rounded-lg transition" onClick={() => setIsMobileMenuOpen(false)}>
                {t.trackOrder}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
