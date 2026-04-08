import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle, Package, MessageCircle, Home, ShoppingBag } from 'lucide-react';
import { mockStoreSettings } from '@/data/mockData';

const OrderSuccessPage: React.FC = () => {
  const location = useLocation();
  const { orderNumber, total, customerName } = location.state || {};

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-lg text-center">
        <div className="bg-white rounded-xl shadow-sm p-8">
          {/* Success Icon */}
          <div className="w-24 h-24 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">تم إرسال طلبك بنجاح!</h1>
          <p className="text-gray-500 mb-6">
            شكراً لك {customerName || ''}، سيتم التواصل معك قريباً عبر واتساب
          </p>

          {/* Order Info */}
          {orderNumber && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500">رقم الطلب</p>
              <p className="text-xl font-bold text-primary-600">{orderNumber}</p>
            </div>
          )}

          {/* WhatsApp Info */}
          <div className="bg-green-50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <MessageCircle className="w-6 h-6 text-green-600" />
              <span className="font-semibold text-green-800">تم فتح محادثة واتساب</span>
            </div>
            <p className="text-sm text-green-700">
              يرجى إكمال معلومات الدفع التي ستظهر في المحادثة مع مدير المتجر
            </p>
          </div>

          {/* Next Steps */}
          <div className="text-right bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">الخطوات التالية:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <Package className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                <span>سيتم مراجعة طلبك من قبل إدارة المتجر</span>
              </li>
              <li className="flex items-start gap-2">
                <MessageCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>سيتم التواصل معك عبر واتساب لتأكيد الطلب والدفع</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span>بعد الدفع، سيتم شحن طلبك في أقرب وقت</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/"
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              الرئيسية
            </Link>
            <a
              href={`https://wa.me/${mockStoreSettings.socialLinks.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              تواصل معنا
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
