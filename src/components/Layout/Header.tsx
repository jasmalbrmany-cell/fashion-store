import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, User, Heart, Menu, X, LayoutDashboard, Store, Languages, Download, Moon, Sun, ChevronDown } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage, translateCategory } from '@/context/LanguageContext';
import type { Language } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { categoriesService, getCachedSync } from '@/services/api';
import { Category } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getItemCount, setIsCartOpen } = useCart();
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const { language, toggleLanguage, t, isRTL } = useLanguage();
  const { toggleTheme, isDark } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>(getCachedSync<Category[]>('categories_all') || []);
  const [notification, setNotification] = useState<{ title: string; body: string; type: 'product' | 'ad' } | null>(null);
  const [megaMenuOpen, setMegaMenuOpen] = useState<string | null>(null); // parentId of open mega menu
  const [megaMenuTimeout, setMegaMenuTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Categorize into parents / children
  const parentCategories = categories.filter(c => !c.parentId);
  const getChildren = (parentId: string) => categories.filter(c => c.parentId === parentId);

  useEffect(() => {
    if (isSupabaseConfigured() && !isAdmin) {
      const channel = supabase.channel('public-notifications')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'products' }, (payload) => {
          setNotification({
             title: isRTL ? '🔥 منتج جديد متوفر الآن!' : '🔥 New Product Available!',
             body: payload.new.name || (isRTL ? 'تسوق أحدث تشكيلاتنا.' : 'Check out our latest collection.'),
             type: 'product'
          });
          setTimeout(() => setNotification(null), 8000);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'ads' }, (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
             setNotification({
               title: isRTL ? '✨ عرض جديد مثير!' : '✨ Exciting New Offer!',
               body: payload.new.title || (isRTL ? 'لا تفوت أحدث عروضنا.' : 'Don\'t miss our latest offers.'),
               type: 'ad'
             });
             setTimeout(() => setNotification(null), 8000);
          }
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [isAdmin, isRTL]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    categoriesService.getAll().then(data => {
      if (data && data.length > 0) setCategories(data);
    });
  }, []);

  const handleInstallApp = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => { setDeferredPrompt(null); });
    }
  };

  const isAdminPage = location.pathname.startsWith('/admin');
  const cartCount = getItemCount();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleMegaMouseEnter = (catId: string) => {
    if (megaMenuTimeout) clearTimeout(megaMenuTimeout);
    setMegaMenuOpen(catId);
  };

  const handleMegaMouseLeave = () => {
    const t = setTimeout(() => setMegaMenuOpen(null), 200);
    setMegaMenuTimeout(t);
  };

  // Icon emoji helper
  const iconEmoji: Record<string, string> = {
    Shirt: '👕', Footprints: '👟', Watch: '⌚', Briefcase: '💼',
    Flower: '🌸', Baby: '👶', Gem: '💎', Sun: '☀️', Snowflake: '❄️',
    Crown: '👑', Star: '⭐', Heart: '❤️', ShoppingBag: '🛍️', Glasses: '👓',
    Layers: '📚', Tag: '🏷️', Zap: '⚡', Package: '📦'
  };

  return (
    <header className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50 border-b border-zinc-200 dark:border-zinc-800 transition-colors duration-300">
      {/* Ticker / Announcement Bar */}
      <div className="bg-primary text-white text-xs font-semibold py-1.5 overflow-hidden flex">
        <div className="animate-marquee gap-8 w-max">
          <span>{isRTL ? '🚀 التوصيل مجاني للطلبات فوق 500 ريال!' : '🚀 Free shipping on orders over 500 SAR!'}</span>
          <span className="mx-8">{isRTL ? '✨ خصم 10% للمستخدمين الجدد استخدم كود: NEW10' : '✨ 10% off for new users using code: NEW10'}</span>
          <span className="mx-8">{isRTL ? '🔥 عروض الصيف بدأت الآن' : '🔥 Summer Sale is here'}</span>
          <span className="mx-8">{isRTL ? '🚀 التوصيل مجاني للطلبات فوق 500 ريال!' : '🚀 Free shipping on orders over 500 SAR!'}</span>
          <span className="mx-8">{isRTL ? '✨ خصم 10% للمستخدمين الجدد استخدم كود: NEW10' : '✨ 10% off for new users using code: NEW10'}</span>
          <span className="mx-8">{isRTL ? '🔥 عروض الصيف بدأت الآن' : '🔥 Summer Sale is here'}</span>
        </div>
      </div>

      {/* Realtime Notification Toast */}
      {notification && (
        <div className={`fixed top-12 left-1/2 -translate-x-1/2 z-[100] bg-zinc-900/90 backdrop-blur-md text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-10 fade-in duration-500 border border-white/10 cursor-pointer hover:bg-zinc-950 transition-colors min-w-[300px] w-[90%] sm:w-auto overflow-hidden`}
           onClick={() => { setNotification(null); navigate(notification.type === 'product' ? '/products' : '/'); }}>
           <div className={`w-2 h-full absolute top-0 ${isRTL ? 'right-0' : 'left-0'} ${notification.type === 'product' ? 'bg-primary' : 'bg-yellow-400'} animate-pulse`}></div>
           <div className="flex-1 ml-2 mr-2">
              <p className="font-black text-sm uppercase tracking-widest text-primary-200 mb-0.5">{notification.title}</p>
              <p className="font-semibold text-xs text-zinc-300 leading-relaxed">{notification.body}</p>
           </div>
           <button onClick={(e) => { e.stopPropagation(); setNotification(null); }} className="p-2 hover:bg-white/10 rounded-full transition shrink-0">
             <X className="w-4 h-4 text-zinc-400 hover:text-white" />
           </button>
        </div>
      )}

      {/* Top Bar */}
      <div className="bg-zinc-900 text-zinc-100 hidden sm:block border-b border-zinc-800">
        <div className="container mx-auto px-4 py-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4 text-sm">
              <a href={`https://wa.me/967777123456`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-green-400 transition">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                <span className="hidden sm:inline">{t.contactUs}</span>
              </a>
            </div>
            <div className="flex items-center gap-3">
              {deferredPrompt && (
                <button onClick={handleInstallApp} className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-white text-black font-bold hover:bg-gray-200 rounded-full text-xs transition shadow-md shadow-white/10 animate-bounce">
                  <Download className="w-3.5 h-3.5" />
                  <span>{t.installApp}</span>
                </button>
              )}
              <button onClick={toggleTheme} className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition" title={isDark ? 'Switch to Light Mode' : 'الوضع المظلم'}>
                {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
              <button onClick={toggleLanguage} className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition" title={language === 'ar' ? 'Switch to English' : 'التبديل للعربية'}>
                <Languages className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'EN' : 'عر'}</span>
              </button>
              <span className="hidden sm:inline text-gray-300">|</span>
              <Link to="/track-order" className="hidden sm:inline text-sm hover:text-gray-300 transition">{t.trackOrder}</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src="/logo.jpg" alt="Fashion Hub" className="h-12 md:h-14 w-auto rounded-md shadow-sm" />
          </Link>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full group">
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-5 py-2.5 pr-12 bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-200 border border-transparent rounded-full focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-zinc-800 transition-all duration-300 ease-in-out group-hover:border-zinc-300 dark:group-hover:border-zinc-700"
              />
              <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-primary transition-colors">
                <Search className="w-5 h-5" />
              </button>
            </div>
          </form>

          {/* Icons */}
          <div className="flex items-center gap-2 md:gap-5">
            {isAuthenticated && isAdmin && (
              <Link to={isAdminPage ? "/" : "/admin"} className="hidden sm:flex items-center gap-2 px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition text-sm">
                {isAdminPage ? (<><Store className="w-4 h-4" /><span>{t.store}</span></>) : (<><LayoutDashboard className="w-4 h-4" /><span>{t.dashboard}</span></>)}
              </Link>
            )}
            <Link to="/favorites" className="hidden md:flex flex-col items-center text-zinc-500 dark:text-zinc-400 hover:text-primary transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-primary/10 transition-colors"><Heart className="w-5 h-5" /></div>
              <span className="text-[10px] font-medium">{t.favorites}</span>
            </Link>
            <button onClick={() => setIsCartOpen(true)} className="relative flex flex-col items-center text-zinc-500 dark:text-zinc-400 hover:text-primary transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-primary/10 transition-colors relative">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/4 bg-primary text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold shadow-sm">{cartCount}</span>
                )}
              </div>
              <span className="text-[10px] font-medium hidden md:block">{t.cart}</span>
            </button>
            {isAuthenticated ? (
              <div className="relative">
                <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex flex-col items-center text-gray-700 hover:text-black transition">
                  <div className="w-7 h-7 bg-black rounded-full flex items-center justify-center"><User className="w-4 h-4 text-white" /></div>
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
                      <Link to="/my-orders" className="block px-4 py-2.5 hover:bg-gray-100 transition" onClick={() => setIsUserMenuOpen(false)}>{t.myOrders}</Link>
                      <Link to="/profile" className="block px-4 py-2.5 hover:bg-gray-100 transition" onClick={() => setIsUserMenuOpen(false)}>{isRTL ? 'الملف الشخصي' : 'My Profile'}</Link>
                      {(user?.role === 'admin' || user?.role === 'editor' || user?.role === 'viewer') && (
                        <Link to="/admin" className="block px-4 py-2.5 hover:bg-gray-100 transition" onClick={() => setIsUserMenuOpen(false)}>{t.dashboard}</Link>
                      )}
                      <button onClick={async () => { await logout(); setIsUserMenuOpen(false); }} className="w-full text-right px-4 py-2.5 hover:bg-red-50 text-red-600 transition">{t.logout}</button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link to="/register" className="flex flex-col items-center text-gray-700 hover:text-black transition">
                <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center"><User className="w-4 h-4" /></div>
                <span className="text-xs mt-0.5 hidden md:block">{t.loginRegister}</span>
              </Link>
            )}
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
            <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"><Search className="w-5 h-5" /></button>
          </div>
        </form>
      </div>

      {/* ── DESKTOP MEGA-MENU NAV ── */}
      <nav className="hidden lg:block border-t border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-1 py-2 overflow-x-auto scrollbar-none text-zinc-600 dark:text-zinc-300 text-sm font-semibold">
            <Link to="/products" className="px-4 py-2 hover:bg-white hover:text-black dark:hover:bg-zinc-800 dark:hover:text-white rounded-lg whitespace-nowrap transition">
              {t.allProducts}
            </Link>

            {parentCategories.map(cat => {
              const children = getChildren(cat.id);
              const hasChildren = children.length > 0;
              return (
                <div
                  key={cat.id}
                  className="relative"
                  onMouseEnter={() => hasChildren && handleMegaMouseEnter(cat.id)}
                  onMouseLeave={handleMegaMouseLeave}
                >
                  <Link
                    to={`/products?category=${cat.id}`}
                    className={`flex items-center gap-1 px-4 py-2 rounded-lg whitespace-nowrap transition hover:bg-white hover:text-black dark:hover:bg-zinc-800 dark:hover:text-white ${megaMenuOpen === cat.id ? 'bg-white text-black dark:bg-zinc-800 dark:text-white shadow-sm' : ''}`}
                  >
                    <span>{iconEmoji[cat.icon || ''] || '📁'}</span>
                    <span>{translateCategory(cat.id, cat.name, language)}</span>
                    {hasChildren && <ChevronDown className={`w-3.5 h-3.5 transition-transform ${megaMenuOpen === cat.id ? 'rotate-180' : ''}`} />}
                  </Link>

                  {/* Mega Dropdown */}
                  {hasChildren && megaMenuOpen === cat.id && (
                    <div
                      className={`absolute top-full ${isRTL ? 'right-0' : 'left-0'} mt-1 z-50 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-100 dark:border-zinc-800 p-4 min-w-[220px] animate-in fade-in slide-in-from-top-2 duration-200`}
                      onMouseEnter={() => { if (megaMenuTimeout) clearTimeout(megaMenuTimeout); }}
                      onMouseLeave={handleMegaMouseLeave}
                    >
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500 px-3 mb-2">
                        {translateCategory(cat.id, cat.name, language)}
                      </p>
                      <Link
                        to={`/products?category=${cat.id}`}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition text-gray-800 dark:text-zinc-200 font-bold text-sm"
                        onClick={() => setMegaMenuOpen(null)}
                      >
                        <span>🛍️</span>
                        <span>{isRTL ? `كل ${cat.name}` : `All ${cat.name}`}</span>
                      </Link>
                      <div className="border-t border-gray-100 dark:border-zinc-800 my-2" />
                      {children.map(child => (
                        <Link
                          key={child.id}
                          to={`/products?category=${child.id}`}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition text-gray-700 dark:text-zinc-300 text-sm"
                          onClick={() => setMegaMenuOpen(null)}
                        >
                          <span className="text-base">{iconEmoji[child.icon || ''] || '•'}</span>
                          <span className="font-semibold">{translateCategory(child.id, child.name, language)}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Fallback: show flat categories if no structured data */}
            {parentCategories.length === 0 && categories.map(cat => (
              <Link key={cat.id} to={`/products?category=${cat.id}`} className="px-4 py-2 hover:bg-white hover:text-black rounded-lg whitespace-nowrap transition">
                {translateCategory(cat.id, cat.name, language)}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* ── MOBILE MENU ── */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-zinc-950 border-t dark:border-zinc-800">
          <nav className="container mx-auto px-4 py-4">
            {isAuthenticated && isAdmin && (
              <Link to={isAdminPage ? "/" : "/admin"} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 bg-black text-white rounded-lg mb-4">
                {isAdminPage ? (<><Store className="w-5 h-5" /><span>{t.store}</span></>) : (<><LayoutDashboard className="w-5 h-5" /><span>{t.dashboard}</span></>)}
              </Link>
            )}

            <div className="flex flex-col gap-1">
              <Link to="/products" className="py-3 px-4 text-gray-800 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-lg font-bold transition" onClick={() => setIsMobileMenuOpen(false)}>
                {t.allProducts}
              </Link>

              {parentCategories.map(cat => {
                const children = getChildren(cat.id);
                return (
                  <MobileMenu key={cat.id} cat={cat} children={children} isRTL={isRTL} language={language} iconEmoji={iconEmoji} onClose={() => setIsMobileMenuOpen(false)} />
                );
              })}

              {parentCategories.length === 0 && categories.map(cat => (
                <Link key={cat.id} to={`/products?category=${cat.id}`} className="py-3 px-4 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-lg transition" onClick={() => setIsMobileMenuOpen(false)}>
                  {translateCategory(cat.id, cat.name, language)}
                </Link>
              ))}

              <hr className="my-3 dark:border-zinc-800" />
              {deferredPrompt && (
                <button onClick={() => { handleInstallApp(); setIsMobileMenuOpen(false); }} className="py-3 px-4 bg-gradient-to-r from-gray-900 to-black text-white hover:from-black hover:to-gray-800 rounded-lg flex items-center gap-3 transition font-bold">
                  <Download className="w-5 h-5 animate-bounce" /> {isRTL ? 'تثبيت التطبيق' : 'Install App'}
                </button>
              )}
              <Link to="/favorites" className="py-3 px-4 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-lg flex items-center gap-3 transition" onClick={() => setIsMobileMenuOpen(false)}>
                <Heart className="w-5 h-5" /> {t.favorites}
              </Link>
              <Link to="/track-order" className="py-3 px-4 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-lg transition" onClick={() => setIsMobileMenuOpen(false)}>
                {t.trackOrder}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

// Mobile menu item with expandable children
const MobileMenu: React.FC<{
  cat: Category;
  children: Category[];
  isRTL: boolean;
  language: Language;
  iconEmoji: Record<string, string>;
  onClose: () => void;
}> = ({ cat, children, isRTL, language, iconEmoji, onClose }) => {
  const [open, setOpen] = useState(false);
  const hasChildren = children.length > 0;
  return (
    <div>
      <div className="flex items-center">
        <Link
          to={`/products?category=${cat.id}`}
          className="flex-1 py-3 px-4 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-lg transition font-semibold flex items-center gap-2"
          onClick={onClose}
        >
          <span>{iconEmoji[cat.icon || ''] || '📁'}</span>
          <span>{translateCategory(cat.id, cat.name, language)}</span>
        </Link>
        {hasChildren && (
          <button onClick={() => setOpen(!open)} className="p-3 text-gray-400 hover:text-black dark:hover:text-white transition">
            <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>
      {hasChildren && open && (
        <div className={`mb-1 ${isRTL ? 'mr-4 border-r-2' : 'ml-4 border-l-2'} border-gray-100 dark:border-zinc-800 ${isRTL ? 'pr-3' : 'pl-3'}`}>
          {children.map(child => (
            <Link
              key={child.id}
              to={`/products?category=${child.id}`}
              className="flex items-center gap-2 py-2.5 px-3 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-900 rounded-xl text-sm transition"
              onClick={onClose}
            >
              <span>{iconEmoji[child.icon || ''] || '•'}</span>
              <span className="font-medium">{translateCategory(child.id, child.name, language)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Header;
