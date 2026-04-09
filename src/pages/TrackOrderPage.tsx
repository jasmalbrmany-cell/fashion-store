import React, { useState } from 'react';
import { Search, Package, CheckCircle, Clock, XCircle, Phone } from 'lucide-react';
import { mockOrders } from '@/data/mockData';
import { Order, OrderStatus } from '@/types';
import { mockStoreSettings } from '@/data/mockData';
import { useLanguage } from '@/context/LanguageContext';

const TrackOrderPage: React.FC = () => {
  const { t, language, isRTL } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    const order = mockOrders.find(
      o =>
        o.orderNumber.toLowerCase().includes(query) ||
        o.customerPhone.includes(query)
    );

    if (order) {
      setFoundOrder(order);
      setNotFound(false);
    } else {
      setFoundOrder(null);
      setNotFound(true);
    }
  };

  const getStatusInfo = (status: OrderStatus) => {
    const statusMap: Record<OrderStatus, { label: string; color: string; icon: React.ReactNode }> = {
      pending: { label: t.statusPending, color: 'text-yellow-600 bg-yellow-100', icon: <Clock className="w-5 h-5" /> },
      waiting_payment: { label: t.statusWaitingPayment, color: 'text-orange-600 bg-orange-100', icon: <Clock className="w-5 h-5" /> },
      paid: { label: t.statusPaid, color: 'text-blue-600 bg-blue-100', icon: <CheckCircle className="w-5 h-5" /> },
      approved: { label: t.statusApproved, color: 'text-green-600 bg-green-100', icon: <CheckCircle className="w-5 h-5" /> },
      completed: { label: t.statusCompleted, color: 'text-green-700 bg-green-200', icon: <CheckCircle className="w-5 h-5" /> },
      cancelled: { label: t.statusCancelled, color: 'text-red-600 bg-red-100', icon: <XCircle className="w-5 h-5" /> },
    };
    return statusMap[status];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US');
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
          {t.trackOrderTitle}
        </h1>

        {/* Search Form */}
        <div className="max-w-xl mx-auto mb-12">
          <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-sm p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t.enterOrderNumber}
            </label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={language === 'ar' ? "مثال: ORD-2025-001" : "Example: ORD-2025-001"}
                  className={`w-full ${isRTL ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-all`}
                />
                <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5`} />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
              >
                {t.search}
              </button>
            </div>
          </form>
        </div>

        {/* Not Found */}
        {notFound && (
          <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t.orderNotFound}</h3>
            <p className="text-gray-500">
              {t.orderNotFoundDesc}
            </p>
          </div>
        )}

        {/* Found Order */}
        {foundOrder && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border">
              {/* Header */}
              <div className="bg-black text-white p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm opacity-80">{t.orderNumber}</p>
                    <p className="text-2xl font-bold">{foundOrder.orderNumber}</p>
                  </div>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full w-fit ${getStatusInfo(foundOrder.status).color}`}>
                    {getStatusInfo(foundOrder.status).icon}
                    <span className="font-bold">{getStatusInfo(foundOrder.status).label}</span>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="p-6 border-b">
                <h3 className="font-bold text-gray-900 mb-6">{t.orderTracking}</h3>
                <div className="space-y-6 relative">
                  {/* Progress Line */}
                  <div className={`absolute top-0 ${isRTL ? 'right-4' : 'left-4'} w-0.5 bg-gray-100 h-full -z-0`} />

                  <div className="flex items-start gap-4 relative z-10">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{t.orderReceived}</p>
                      <p className="text-sm text-gray-500">{formatDate(foundOrder.createdAt)}</p>
                    </div>
                  </div>

                  {(foundOrder.status === 'paid' || foundOrder.status === 'approved' || foundOrder.status === 'completed') && (
                    <div className="flex items-start gap-4 relative z-10">
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{t.paymentConfirmed}</p>
                        <p className="text-sm text-gray-500">{formatDate(foundOrder.updatedAt)}</p>
                      </div>
                    </div>
                  )}

                  {foundOrder.status === 'completed' && (
                    <div className="flex items-start gap-4 relative z-10">
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{t.orderDelivered}</p>
                        <p className="text-sm text-gray-500">{formatDate(foundOrder.updatedAt)}</p>
                      </div>
                    </div>
                  )}

                  {foundOrder.status === 'cancelled' && (
                    <div className="flex items-start gap-4 relative z-10">
                      <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                        <XCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{t.orderCancelled}</p>
                        <p className="text-sm text-gray-500">{formatDate(foundOrder.updatedAt)}</p>
                      </div>
                    </div>
                  )}

                  {(foundOrder.status === 'pending' || foundOrder.status === 'waiting_payment') && (
                    <div className="flex items-start gap-4 opacity-60 relative z-10">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 shrink-0">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-500">{t.statusPending}</p>
                        <p className="text-sm text-gray-400">{language === 'ar' ? 'جارٍ المعالجة...' : 'Processing...'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Details */}
              <div className="p-6">
                <h3 className="font-bold text-gray-900 mb-4">{t.orderDetails}</h3>

                {/* Customer Info */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs mb-1">{t.name}</p>
                      <p className="font-bold">{foundOrder.customerName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">{t.phone}</p>
                      <p className="font-bold" dir="ltr">{foundOrder.customerPhone}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">{t.city}</p>
                      <p className="font-bold">{foundOrder.city}</p>
                    </div>
                    {foundOrder.address && (
                      <div>
                        <p className="text-gray-500 text-xs mb-1">{t.address}</p>
                        <p className="font-bold">{foundOrder.address}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-4 mb-6">
                  {foundOrder.items.map((item) => (
                    <div key={item.id} className="flex gap-4 p-2 hover:bg-gray-50 transition-colors rounded-lg">
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="w-20 h-20 object-cover rounded-xl shadow-sm"
                      />
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 text-sm">{item.productName}</h4>
                        <div className="flex gap-2 mt-1">
                          {item.size && (
                            <span className="text-[10px] px-2 py-0.5 bg-white border rounded text-gray-500">
                              {t.size}: {item.size}
                            </span>
                          )}
                          {item.color && (
                            <span className="text-[10px] px-2 py-0.5 bg-white border rounded text-gray-500">
                              {t.color}: {item.color}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{t.quantity}: {item.quantity}</p>
                        <p className="font-bold text-black mt-1">
                          {formatPrice(item.price * item.quantity)} {t.rial}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t.subtotal}</span>
                    <span className="font-medium">{formatPrice(foundOrder.subtotal)} {t.rial}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t.shipping}</span>
                    <span className="font-medium">{formatPrice(foundOrder.shippingCost)} {t.rial}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-3 mt-2">
                    <span>{t.orderTotal}</span>
                    <span className="text-black">{formatPrice(foundOrder.total)} {t.rial}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="mt-8 text-center bg-white rounded-2xl p-8 shadow-sm border">
              <h3 className="text-lg font-bold mb-2">{language === 'ar' ? 'تحتاج مساعدة؟' : 'Need Help?'}</h3>
              <p className="text-gray-500 mb-6">{language === 'ar' ? 'يسعدنا خدمتك عبر واتساب' : 'We are happy to serve you via WhatsApp'}</p>
              <a
                href={`https://wa.me/${mockStoreSettings.socialLinks.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-all shadow-lg hover:shadow-green-200"
              >
                <Phone className="w-5 h-5" />
                {t.whatsappContact}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackOrderPage;
