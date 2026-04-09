import React from 'react';
import { Link } from 'react-router-dom';
import { Store, Phone, MessageCircle, Facebook, Instagram } from 'lucide-react';
import { mockStoreSettings } from '@/data/mockData';
import { useLanguage, categoryNames } from '@/context/LanguageContext';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const { t, language } = useLanguage();

  return (
    <footer className="bg-gray-900 text-white" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Store className="w-8 h-8 text-primary-400" />
              <span className="text-xl font-bold">{mockStoreSettings.name}</span>
            </div>
            <p className="text-gray-400 mb-4">{t.footerAbout}</p>
            <div className="flex gap-3">
              {mockStoreSettings.socialLinks.facebook && (
                <a href={mockStoreSettings.socialLinks.facebook} target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary-600 transition">
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {mockStoreSettings.socialLinks.instagram && (
                <a href={mockStoreSettings.socialLinks.instagram} target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary-600 transition">
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              <a href={`https://wa.me/${mockStoreSettings.socialLinks.whatsapp}`} target="_blank" rel="noopener noreferrer"
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
                <a href={`https://wa.me/${mockStoreSettings.socialLinks.whatsapp}`} target="_blank" rel="noopener noreferrer"
                  className="hover:text-white transition" dir="ltr">
                  {mockStoreSettings.socialLinks.whatsapp}
                </a>
              </li>
              <li className="flex items-center gap-3 text-gray-400">
                <Phone className="w-5 h-5 text-primary-400" />
                <span dir="ltr">{mockStoreSettings.socialLinks.whatsapp}</span>
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
              {t.allRights} © {currentYear} - {mockStoreSettings.name}
            </p>
            <p className="text-gray-400 text-sm">{t.madeWith}</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
