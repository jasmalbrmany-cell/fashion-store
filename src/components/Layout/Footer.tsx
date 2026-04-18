import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Store, Phone, MessageCircle, Facebook, Instagram } from 'lucide-react';
import { storeSettingsService } from '@/services/api';
import { StoreSettings } from '@/types';
import { useLanguage, categoryNames } from '@/context/LanguageContext';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const { t, language } = useLanguage();
  const [settings, setSettings] = useState<StoreSettings | null>(null);

  useEffect(() => {
    storeSettingsService.get().then(data => {
      if (data) setSettings(data);
    });
  }, []);

  if (!settings) return null;

  return (
    <footer className="bg-gray-900 text-white" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Store className="w-8 h-8 text-primary-400" />
              <span className="text-xl font-bold">{settings.name}</span>
            </div>
            <p className="text-gray-400 mb-4">{t.footerAbout}</p>
            <div className="flex gap-3">
              {settings.socialLinks.facebook && (
                <a href={settings.socialLinks.facebook} target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary-600 transition">
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {settings.socialLinks.instagram && (
                <a href={settings.socialLinks.instagram} target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary-600 transition">
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {settings.socialLinks.tiktok && (
                <a href={settings.socialLinks.tiktok} target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-black transition">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                     <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.01.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                </a>
              )}
              <a href={`https://wa.me/${settings.socialLinks.whatsapp}`} target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-600 transition">
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">{t.quickLinks}</h3>
            <ul className="space-y-2">
              <li><Link to="/products" className="text-gray-400 hover:text-white transition">{t.allProducts}</Link></li>
              <li><Link to="/products?category=cat-1" className="text-gray-400 hover:text-white transition">
                {categoryNames['cat-1'][language]}
              </Link></li>
              <li><Link to="/products?category=cat-2" className="text-gray-400 hover:text-white transition">
                {categoryNames['cat-2'][language]}
              </Link></li>
              <li><Link to="/track-order" className="text-gray-400 hover:text-white transition">{t.trackMyOrder}</Link></li>
              <li><Link to="/my-orders" className="text-gray-400 hover:text-white transition">{t.myOrders}</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-lg font-bold mb-4">{t.footerCategories}</h3>
            <ul className="space-y-2">
              <li><Link to="/products?category=cat-3" className="text-gray-400 hover:text-white transition">
                {categoryNames['cat-3'][language]}
              </Link></li>
              <li><Link to="/products?category=cat-4" className="text-gray-400 hover:text-white transition">
                {categoryNames['cat-4'][language]}
              </Link></li>
              <li><Link to="/products?category=cat-5" className="text-gray-400 hover:text-white transition">
                {categoryNames['cat-5'][language]}
              </Link></li>
              <li><Link to="/products?category=cat-6" className="text-gray-400 hover:text-white transition">
                {categoryNames['cat-6'][language]}
              </Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-4">{t.contactInfo}</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-gray-400">
                <MessageCircle className="w-5 h-5 text-primary-400" />
                <a href={`https://wa.me/${settings.socialLinks.whatsapp}`} target="_blank" rel="noopener noreferrer"
                  className="hover:text-white transition" dir="ltr">
                  {settings.socialLinks.whatsapp}
                </a>
              </li>
              <li className="flex items-center gap-3 text-gray-400">
                <Phone className="w-5 h-5 text-primary-400" />
                <span dir="ltr">{settings.socialLinks.whatsapp}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-2">
            <p className="text-gray-400 text-sm">
              {t.allRights} © {currentYear} - {settings.name}
            </p>
            <p className="text-gray-400 text-sm flex gap-1 items-center justify-center flex-wrap" dir="ltr">
              <span dir="rtl">{t.madeWith}</span> 
              <span className="text-white font-bold tracking-wider">D\Daoodalhashdi</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
