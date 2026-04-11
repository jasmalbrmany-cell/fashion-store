import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './Header';
import Footer from './Footer';
import BottomNav from './BottomNav';
import PWAInstall from './PWAInstall';

const Layout: React.FC = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-transparent md:pb-0 pb-16">
      <PWAInstall />
      <Header />
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="flex-1"
        >
          <div className="bg-white/70 dark:bg-black/70 backdrop-blur-sm min-h-full">
            <Outlet />
          </div>
        </motion.main>
      </AnimatePresence>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default Layout;
