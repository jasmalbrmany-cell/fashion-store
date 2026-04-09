import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle, Package, MessageCircle, Home, Loader2 } from 'lucide-react';
import { storeSettingsService } from '@/services/api';
import { StoreSettings } from '@/types';
import { useLanguage } from '@/context/LanguageContext';

const OrderSuccessPage: React.FC = () => {
  const location = useLocation();
  const { t, isRTL } = useLanguage();
  const { orderNumber, customerName } = location.state || {};
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await storeSettingsService.get();
        setSettings(data);
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-black" />
        <p className="text-gray-500 font-medium">{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-xl">
        <div className="bg-white rounded-3xl shadow-xl border p-8 md:p-12 text-center">
          {/* Success Icon */}
          <div className="w-24 h-24 mx-auto mb-8 bg-green-50 rounded-full flex items-center justify-center animate-bounce">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>

          <h1 className="text-3xl font-black text-gray-900 mb-4">{t.orderSuccessTitle}</h1>
          <p className="text-gray-500 text-lg mb-8">
            {t.thankYou} <span className="text-black font-bold uppercase">{customerName || ''}</span>, {t.orderSuccessDesc}
          </p>

          {/* Order Info */}
          {orderNumber && (
            <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{t.orderNumberLabel}</p>
              <p className="text-3xl font-black text-black">{orderNumber}</p>
            </div>
          )}

          {/* WhatsApp Status */}
          <div className="bg-green-50 rounded-2xl p-6 mb-8 border border-green-100 flex flex-col items-center gap-3">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-6 h-6 text-green-600 rounded-full bg-white p-1" />
              <span className="font-bold text-green-800">{t.whatsappConversationOpened}</span>
            </div>
            <p className="text-sm text-green-700 leading-relaxed font-medium">
              {t.completePaymentInWhatsapp}
            </p>
          </div>

          {/* Timeline / Next Steps */}
          <div className="bg-gray-50/50 rounded-2xl p-6 mb-10 text-right space-y-6">
            <h3 className={`font-black text-gray-900 mb-4 flex items-center gap-2 ${isRTL ? 'flex-row' : 'flex-row-reverse justify-end'}`}>
              {t.nextSteps}
              <div className="w-1.5 h-1.5 rounded-full bg-black"></div>
            </h3>
            <ul className="space-y-4">
              <li className={`flex items-start gap-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                <div className="w-8 h-8 rounded-lg bg-white border shadow-sm flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">1</div>
                <p className="text-sm text-gray-600 font-medium">{t.reviewOrder}</p>
              </li>
              <li className={`flex items-start gap-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                <div className="w-8 h-8 rounded-lg bg-white border shadow-sm flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">2</div>
                <p className="text-sm text-gray-600 font-medium">{t.contactConfirmAndPay}</p>
              </li>
              <li className={`flex items-start gap-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                <div className="w-8 h-8 rounded-lg bg-white border shadow-sm flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">3</div>
                <p className="text-sm text-gray-600 font-medium">{t.shipSoon}</p>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/"
              className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-black hover:bg-gray-200 transition flex items-center justify-center gap-2 uppercase tracking-wide text-sm"
            >
              <Home className="w-5 h-5" />
              {t.home}
            </Link>
            <a
              href={`https://wa.me/${settings?.socialLinks.whatsapp || ''}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-4 bg-green-500 text-white rounded-2xl font-black hover:bg-green-600 transition flex items-center justify-center gap-2 shadow-xl hover:shadow-green-100 uppercase tracking-wide text-sm"
            >
              <MessageCircle className="w-5 h-5" />
              {t.contactUs}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
