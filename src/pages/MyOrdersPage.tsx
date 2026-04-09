import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, MapPin, Clock, LogOut, ChevronLeft, CreditCard, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockOrders } from '@/data/mockData';
import { Order, OrderStatus } from '@/types';
import { useLanguage } from '@/context/LanguageContext';

const MyOrdersPage: React.FC = () => {
  const { user, logout, isLoading: authLoading } = useAuth();
  const { t, language, isRTL } = useLanguage();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchMyOrders = async () => {
      if (!user) return;
      setIsLoading(true);
      
      if (!isSupabaseConfigured()) {
        const myMockOrders = mockOrders.filter(o => 
          o.customerPhone === user.phone || o.customerName === user.name
        );
        setOrders(myMockOrders);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders(data || []);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchMyOrders();
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getStatusDisplay = (status: OrderStatus) => {
    const map: Record<OrderStatus, { label: string; color: string; bg: string }> = {
      pending: { label: t.statusPending, color: 'text-amber-600', bg: 'bg-amber-50' },
      waiting_payment: { label: t.statusWaitingPayment, color: 'text-orange-600', bg: 'bg-orange-50' },
      paid: { label: t.statusPaid, color: 'text-blue-600', bg: 'bg-blue-50' },
      approved: { label: t.statusApproved, color: 'text-indigo-600', bg: 'bg-indigo-50' },
      completed: { label: t.statusCompleted, color: 'text-green-600', bg: 'bg-green-50' },
      cancelled: { label: t.statusCancelled, color: 'text-red-600', bg: 'bg-red-50' },
    };
    return map[status] || map.pending;
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US');
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4">
        
        {/* Header Section */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t.myAccount}</h1>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 rounded-xl shadow-sm border border-red-100 hover:bg-red-50 transition font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline">{t.logout}</span>
          </button>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          
          {/* Sidebar */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-black to-gray-700 text-white rounded-full mx-auto flex items-center justify-center text-3xl font-bold shadow-lg mb-4">
                {user.name?.charAt(0)}
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">{user.name}</h2>
              <p className="text-gray-500 text-sm mb-4" dir="ltr">{user.phone || user.email}</p>
              <div className="inline-block px-3 py-1 bg-black text-white text-xs rounded-full font-bold">
                {user.role === 'admin' ? t.adminRole : t.premiumCustomer}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
                <h3 className="font-bold text-gray-900">{t.menu}</h3>
              </div>
              <ul className="divide-y divide-gray-50">
                <li>
                  <Link to="/my-orders" className={`flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition ${isRTL ? 'bg-black/5' : 'bg-black/5'}`}>
                    <div className="flex items-center gap-3 font-bold text-black">
                      <Package className="w-5 h-5" />
                      {t.myOrders}
                    </div>
                    {isRTL ? <ChevronLeft className="w-4 h-4 text-black" /> : <ChevronLeft className="w-4 h-4 text-black rotate-180" />}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-8">
                <Package className="w-6 h-6 text-gray-900" />
                <h2 className="text-xl font-bold text-gray-900">{t.ordersHistory}</h2>
              </div>

              {isLoading ? (
                <div className="py-20 flex justify-center">
                  <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{t.noOrdersYet}</h3>
                  <p className="text-gray-500 mb-6">{t.noOrdersYetDesc}</p>
                  <Link to="/products" className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition shadow-lg">
                    {t.backToShopping}
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const status = getStatusDisplay(order.status as OrderStatus);
                    const isExpanded = expandedOrder === order.id;
                    const items = Array.isArray(order.items) ? order.items : [];
                    const orderNumber = (order as any).order_number || (order as any).orderNumber;
                    const orderDate = (order as any).created_at || (order as any).createdAt;

                    return (
                      <div key={order.id} className="border border-gray-100 rounded-2xl overflow-hidden transition-all hover:border-gray-300">
                        {/* Order Header */}
                        <div 
                          className="p-4 md:p-5 bg-white flex flex-wrap lg:flex-nowrap items-center justify-between gap-4 cursor-pointer"
                          onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${status.bg}`}>
                              <Package className={`w-6 h-6 ${status.color}`} />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-0.5">{t.orderNumberLabel}</p>
                              <p className="font-bold text-gray-900">{orderNumber}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 lg:gap-12 flex-1 lg:flex-none justify-between lg:justify-end">
                            <div className="hidden sm:block">
                              <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> {t.orderDate}</p>
                              <p className="font-bold text-gray-900">{formatDate(orderDate)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-0.5 flex items-center gap-1"><CreditCard className="w-3.5 h-3.5"/> {t.total}</p>
                              <p className="font-bold text-black">{formatPrice(order.total)} {t.rial}</p>
                            </div>
                            <div className={`text-${isRTL ? 'left' : 'right'} flex flex-col items-end`}>
                              <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap mb-1 ${status.bg} ${status.color} border border-current/10`}>
                                {status.label}
                              </span>
                              <div className="text-gray-400">
                                {isExpanded ? <ChevronUp className="w-5 h-5"/> : <ChevronDown className="w-5 h-5"/>}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Order Details */}
                        {isExpanded && (
                          <div className="border-t border-gray-100 bg-gray-50/50 p-4 md:p-6">
                            <div className="grid md:grid-cols-2 gap-6 mb-8">
                              <div>
                                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-gray-500"/>
                                  {t.shippingAddress}
                                </h4>
                                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                  <p className="font-bold text-gray-900">{(order as any).customer_name || (order as any).customerName}</p>
                                  <p className="text-gray-500 text-sm mt-1" dir="ltr">{(order as any).customer_phone || (order as any).customerPhone}</p>
                                  <p className="text-gray-600 text-sm mt-2">{order.city} - {order.address}</p>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                  <CreditCard className="w-4 h-4 text-gray-500"/>
                                  {t.paymentSummary}
                                </h4>
                                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-2">
                                  <div className="flex justify-between text-gray-500 text-sm">
                                    <span>{t.subtotal}</span>
                                    <span>{formatPrice(order.subtotal)} {t.rial}</span>
                                  </div>
                                  <div className="flex justify-between text-gray-500 text-sm">
                                    <span>{t.shipping}</span>
                                    <span>{formatPrice((order as any).shipping_cost || order.shippingCost || 0)} {t.rial}</span>
                                  </div>
                                  <div className="pt-2 border-t mt-2 flex justify-between font-bold text-black text-lg">
                                    <span>{t.total}</span>
                                    <span>{formatPrice(order.total)} {t.rial}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <h4 className="font-bold text-gray-900 mb-4">{t.itemsSummary} ({items.length})</h4>
                            <div className="space-y-3">
                              {items.map((item: any) => (
                                <div key={item.id} className="flex items-center gap-4 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                  <img src={item.productImage || item.product_image} alt={item.productName || item.product_name} className="w-16 h-16 object-cover rounded-lg" />
                                  <div className="flex-1">
                                    <h5 className="font-bold text-gray-900 text-sm">{item.productName || item.product_name}</h5>
                                    <div className="flex flex-wrap gap-3 text-[10px] text-gray-500 mt-1">
                                      {item.size && <span className="px-2 py-0.5 bg-gray-50 rounded border">{t.size}: {item.size}</span>}
                                      {item.color && <span className="px-2 py-0.5 bg-gray-50 rounded border">{t.color}: {item.color}</span>}
                                      <span className="px-2 py-0.5 bg-gray-50 rounded border">{t.quantity}: {item.quantity}</span>
                                    </div>
                                  </div>
                                  <div className="font-bold text-black text-sm">
                                    {formatPrice(item.price * item.quantity)} {t.rial}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MyOrdersPage;
