import React, { useState, useEffect } from 'react';
import { Search, Package, CheckCircle, Clock, XCircle, Phone } from 'lucide-react';
import { ordersService, storeSettingsService } from '@/services/api';
import { Order, OrderStatus, StoreSettings } from '@/types';
import { useLanguage } from '@/context/LanguageContext';

const TrackOrderPage: React.FC = () => {
  const { t, language, isRTL } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<StoreSettings | null>(null);

  useEffect(() => {
    storeSettingsService.get().then(setSettings);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setLoading(true);
    setNotFound(false);
    setFoundOrder(null);

    try {
      const order = await ordersService.getByNumber(query);

      if (order) {
        setFoundOrder(order);
      } else {
        setNotFound(true);
      }
    } catch (err) {
      console.error('Tracking search error:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
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
                disabled={loading}
                className="px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {t.search}
              </button>
            </div>
          </form>
        </div>

        {/* Not Found */}
        {notFound && (
          <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm p-8 text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-zinc-900 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t.orderNotFound}</h3>
            <p className="text-gray-500">
              {t.orderNotFoundDesc}
            </p>
          </div>
        )}

        {/* Found Order */}
        {foundOrder && (
          <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-5 duration-700">
            <div className="bg-white dark:bg-zinc-950 rounded-2xl shadow-sm overflow-hidden border dark:border-zinc-800">
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

              {/* Visual Progress Stepper */}
              <div className="p-6 md:p-10 border-b dark:border-zinc-800 bg-gray-50/30 dark:bg-zinc-900/10">
                <h3 className="font-bold text-gray-900 dark:text-white mb-8">{t.orderTracking}</h3>
                
                <div className="relative max-w-4xl mx-auto">
                  {/* Desktop Progress Line */}
                  <div className="hidden sm:block absolute top-5 left-10 right-10 h-1 bg-gray-100 dark:bg-zinc-800 rounded-full z-0 overflow-hidden">
                     <div className={`h-full bg-green-500 transition-all duration-1000 ${
                       foundOrder.status === 'pending' || foundOrder.status === 'waiting_payment' ? 'w-0' :
                       foundOrder.status === 'paid' || foundOrder.status === 'approved' ? 'w-1/2' :
                       foundOrder.status === 'completed' ? 'w-full' : 'w-0'
                     }`} />
                  </div>
                  
                  {/* Mobile Progress Line */}
                  <div className={`sm:hidden absolute top-0 ${isRTL ? 'right-[27px]' : 'left-[27px]'} bottom-0 w-1 bg-gray-100 dark:bg-zinc-800 rounded-full z-0`} />

                  <div className="flex flex-col sm:flex-row justify-between gap-8 sm:gap-4 relative z-10">
                    
                    {/* Step 1: Placed */}
                    <div className="flex sm:flex-col items-center gap-4 sm:gap-3 text-left sm:text-center shrink-0">
                      <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center text-white shadow-xl shadow-green-200 ring-4 ring-white shrink-0">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <div className={`flex flex-col sm:items-center ${isRTL ? 'sm:text-center text-right' : 'sm:text-center text-left'}`}>
                        <p className="font-bold text-gray-900 dark:text-white">{t.orderReceived}</p>
                        <p className="text-xs font-semibold text-gray-500 mt-0.5">{formatDate(foundOrder.createdAt)}</p>
                      </div>
                    </div>

                    {/* Step 2: Processing / Paid */}
                    <div className={`flex sm:flex-col items-center gap-4 sm:gap-3 shrink-0 ${foundOrder.status === 'cancelled' ? 'opacity-20' : ''}`}>
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-zinc-900 shadow-md shrink-0 transition-all duration-500 ${
                        foundOrder.status === 'pending' || foundOrder.status === 'waiting_payment' 
                        ? 'bg-white dark:bg-zinc-900 border-2 border-dashed border-gray-300 dark:border-zinc-700 text-gray-400' 
                        : 'bg-green-500 text-white shadow-green-200 shadow-xl'
                      }`}>
                        {foundOrder.status === 'pending' || foundOrder.status === 'waiting_payment' ? <Clock className="w-6 h-6 animate-pulse" /> : <CheckCircle className="w-6 h-6" />}
                      </div>
                      <div className={`flex flex-col sm:items-center ${isRTL ? 'sm:text-center text-right' : 'sm:text-center text-left'}`}>
                        <p className={`font-bold ${foundOrder.status === 'pending' || foundOrder.status === 'waiting_payment' ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                          {t.paymentConfirmed}
                        </p>
                        {(foundOrder.status === 'paid' || foundOrder.status === 'approved' || foundOrder.status === 'completed') && (
                          <p className="text-xs font-semibold text-gray-500 mt-0.5">{formatDate(foundOrder.updatedAt)}</p>
                        )}
                        {(foundOrder.status === 'pending' || foundOrder.status === 'waiting_payment') && (
                          <p className="text-xs font-semibold text-gray-400 mt-0.5">{language === 'ar' ? 'جارٍ المعالجة' : 'Processing'}</p>
                        )}
                      </div>
                    </div>

                    {/* Step 3: Delivered */}
                    {foundOrder.status !== 'cancelled' ? (
                      <div className="flex sm:flex-col items-center gap-4 sm:gap-3 shrink-0">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-zinc-900 shadow-md shrink-0 transition-all duration-500 ${
                          foundOrder.status === 'completed' 
                          ? 'bg-black dark:bg-white dark:text-black text-white shadow-2xl shadow-black/40 scale-110' 
                          : 'bg-white dark:bg-zinc-900 border-2 border-dashed border-gray-300 dark:border-zinc-700 text-gray-300'
                        }`}>
                          <Package className="w-6 h-6" />
                        </div>
                        <div className={`flex flex-col sm:items-center ${isRTL ? 'sm:text-center text-right' : 'sm:text-center text-left'}`}>
                          <p className={`font-bold ${foundOrder.status === 'completed' ? 'text-black dark:text-white text-lg' : 'text-gray-400'}`}>
                            {t.orderDelivered}
                          </p>
                          {foundOrder.status === 'completed' && (
                            <p className="text-xs font-semibold text-green-500 mt-0.5">{formatDate(foundOrder.updatedAt)}</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex sm:flex-col items-center gap-4 sm:gap-3 shrink-0">
                        <div className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center ring-4 ring-white shadow-xl shadow-red-200 shrink-0">
                          <XCircle className="w-6 h-6" />
                        </div>
                        <div className={`flex flex-col sm:items-center ${isRTL ? 'sm:text-center text-right' : 'sm:text-center text-left'}`}>
                          <p className="font-bold text-red-600">
                            {t.orderCancelled}
                          </p>
                          <p className="text-xs font-semibold text-gray-500 mt-0.5">{formatDate(foundOrder.updatedAt)}</p>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </div>

              {/* Order Details */}
              <div className="p-6">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">{t.orderDetails}</h3>

                {/* Customer Info */}
                <div className="bg-gray-50 dark:bg-zinc-900 rounded-xl p-4 mb-6 border border-gray-100 dark:border-zinc-800">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div>
                      <p className="text-xs mb-1">{t.name}</p>
                      <p className="font-bold text-gray-900 dark:text-white">{foundOrder.customerName}</p>
                    </div>
                    <div>
                      <p className="text-xs mb-1">{t.phone}</p>
                      <p className="font-bold text-gray-900 dark:text-white" dir="ltr">{foundOrder.customerPhone}</p>
                    </div>
                    <div>
                      <p className="text-xs mb-1">{t.city}</p>
                      <p className="font-bold text-gray-900 dark:text-white">{foundOrder.city}</p>
                    </div>
                    {foundOrder.address && (
                      <div>
                        <p className="text-xs mb-1">{t.address}</p>
                        <p className="font-bold text-gray-900 dark:text-white">{foundOrder.address}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-4 mb-6">
                  {foundOrder.items.map((item) => (
                    <div key={item.id} className="flex gap-4 p-2 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors rounded-lg">
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="w-20 h-20 object-cover rounded-xl shadow-sm"
                      />
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm leading-tight">{item.productName}</h4>
                        <div className="flex gap-2 mt-1">
                          {item.size && (
                            <span className="text-[10px] px-2 py-0.5 bg-white dark:bg-zinc-800 border dark:border-zinc-700 rounded text-gray-500">
                              {t.size}: {item.size}
                            </span>
                          )}
                          {item.color && (
                            <span className="text-[10px] px-2 py-0.5 bg-white dark:bg-zinc-800 border dark:border-zinc-700 rounded text-gray-500">
                              {t.color}: {item.color}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{t.quantity}: {item.quantity}</p>
                        <p className="font-bold text-black dark:text-white mt-1">
                          {formatPrice(item.price * item.quantity)} {t.rial}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="border-t dark:border-zinc-800 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t.subtotal}</span>
                    <span className="font-medium dark:text-white">{formatPrice(foundOrder.subtotal)} {t.rial}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t.shipping}</span>
                    <span className="font-medium dark:text-white">{formatPrice(foundOrder.shippingCost)} {t.rial}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t dark:border-zinc-800 pt-3 mt-2">
                    <span className="dark:text-white">{t.orderTotal}</span>
                    <span className="text-black dark:text-white">{formatPrice(foundOrder.total)} {t.rial}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="mt-8 text-center bg-white dark:bg-zinc-950 rounded-2xl p-8 shadow-sm border dark:border-zinc-800">
              <h3 className="text-lg font-bold mb-2 dark:text-white">{language === 'ar' ? 'تحتاج مساعدة؟' : 'Need Help?'}</h3>
              <p className="text-gray-500 mb-6">{language === 'ar' ? 'يسعدنا خدمتك عبر واتساب' : 'We are happy to serve you via WhatsApp'}</p>
              <a
                href={`https://wa.me/${(settings?.socialLinks.whatsapp || '967777123456').replace(/[^0-9]/g, '')}`}
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
