import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Grid, ShoppingCart, User } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useCart } from '@/context/CartContext';

const BottomNav: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { items } = useCart();
  const location = useLocation();

  const cartItemCount = items.reduce((total, item) => total + item.quantity, 0);

  // Hide bottom nav on admin pages or checkout
  if (location.pathname.startsWith('/admin') || location.pathname === '/checkout') {
    return null;
  }

  const navItems = [
    { to: '/', icon: <Home className="w-6 h-6" />, label: t.home || (isRTL ? 'الرئيسية' : 'Home') },
    { to: '/categories', icon: <Grid className="w-6 h-6" />, label: t.products || (isRTL ? 'الأقسام' : 'Categories') },
    { to: '/cart', icon: <ShoppingCart className="w-6 h-6" />, label: t.cart || (isRTL ? 'السلة' : 'Cart'), badge: cartItemCount },
    { to: '/profile', icon: <User className="w-6 h-6" />, label: t.myAccount || (isRTL ? 'حسابي' : 'Profile') },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-black/90 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 z-50 pb-safe">
      <nav className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
          
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 relative ${
                isActive 
                  ? 'text-black dark:text-white transform -translate-y-1' 
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <div className="relative">
                {item.icon}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 bg-black text-white dark:bg-white dark:text-black text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full animate-in zoom-in shadow-lg">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 font-bold ${isActive ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'} transition-all duration-300`}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-black dark:bg-white rounded-full"></span>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNav;
