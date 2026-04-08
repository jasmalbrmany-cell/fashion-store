import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, MapPin, Clock, User, LogOut, ChevronLeft, CreditCard, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mockOrders } from '@/data/mockData';
import { Order } from '@/types';

const MyOrdersPage: React.FC = () => {
  const { user, logout, isLoading: authLoading } = useAuth();
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

  const getStatusDisplay = (status: string) => {
    const map: Record<string, { label: string; color: string; bg: string }> = {
      pending: { label: 'معلق', color: 'text-amber-600', bg: 'bg-amber-50' },
      waiting_payment: { label: 'بانتظار الدفع', color: 'text-orange-600', bg: 'bg-orange-50' },
      paid: { label: 'تم الدفع', color: 'text-blue-600', bg: 'bg-blue-50' },
      approved: { label: 'موافق عليه/قيد التجهيز', color: 'text-indigo-600', bg: 'bg-indigo-50' },
      completed: { label: 'مكتمل/تم التوصيل', color: 'text-green-600', bg: 'bg-green-50' },
      cancelled: { label: 'ملغي', color: 'text-red-600', bg: 'bg-red-50' },
    };
    return map[status] || map.pending;
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        
        {/* Header Section */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">حسابي</h1>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 rounded-lg shadow-sm border border-red-100 hover:bg-red-50 transition"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline">تسجيل الخروج</span>
          </button>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          
          {/* Sidebar */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-900 to-gray-700 text-white rounded-full mx-auto flex items-center justify-center text-3xl font-bold shadow-lg mb-4">
                {user.name?.charAt(0)}
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">{user.name}</h2>
              <p className="text-gray-500 text-sm mb-4" dir="ltr">{user.phone || user.email}</p>
              <div className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full font-medium">
                {user.role === 'admin' ? 'مدير المتجر' : 'عميل مميز'}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
                <h3 className="font-bold text-gray-900">القائمة</h3>
              </div>
              <ul className="divide-y divide-gray-50">
                <li>
                  <Link to="/my-orders" className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition bg-black/5">
                    <div className="flex items-center gap-3 font-medium text-black">
                      <Package className="w-5 h-5" />
                      طلباتي
                    </div>
                    <ChevronLeft className="w-4 h-4 text-black" />
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
                <h2 className="text-xl font-bold text-gray-900">سجل طلباتي</h2>
              </div>

              {isLoading ? (
                <div className="py-20 flex justify-center">
                  <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">لا توجد طلبات بعد</h3>
                  <p className="text-gray-500 mb-6">لم تقم بإجراء أي طلبات حتى الآن، تصفح المتجر واكتشف منتجاتنا!</p>
                  <Link to="/products" className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition shadow-lg">
                    العودة للتسوق
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const status = getStatusDisplay(order.status);
                    const isExpanded = expandedOrder === order.id;
                    const items = Array.isArray(order.items) ? order.items : [];

                    return (
                      <div key={order.id} className="border border-gray-200 rounded-xl overflow-hidden transition-all hover:border-gray-300">
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
                              <p className="text-sm text-gray-500 mb-1">طلب رقم</p>
                              <p className="font-bold text-gray-900">{(order as any).order_number || (order as any).orderNumber}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 lg:gap-12 flex-1 lg:flex-none justify-between lg:justify-end">
                            <div className="hidden sm:block">
                              <p className="text-sm text-gray-500 mb-1 flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> التاريخ</p>
                              <p className="font-medium text-gray-900">{new Date((order as any).created_at || (order as any).createdAt).toLocaleDateString('ar-SA')}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 mb-1 flex items-center gap-1"><CreditCard className="w-3.5 h-3.5"/> الإجمالي</p>
                              <p className="font-bold text-gray-900">{order.total.toLocaleString('ar-SA')} ر.ي</p>
                            </div>
                            <div className="text-left flex flex-col items-end">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap mb-1 ${status.bg} ${status.color}`}>
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
                          <div className="border-t border-gray-100 bg-gray-50 p-4 md:p-6">
                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-gray-500"/>
                                  عنوان التوصيل
                                </h4>
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                  <p className="font-medium text-gray-900">{(order as any).customer_name || (order as any).customerName}</p>
                                  <p className="text-gray-600 mt-1" dir="ltr">{(order as any).customer_phone || (order as any).customerPhone}</p>
                                  <p className="text-gray-600 mt-2">{order.city} - {order.address}</p>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                  <CreditCard className="w-4 h-4 text-gray-500"/>
                                  ملخص الدفع
                                </h4>
                                <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-2">
                                  <div className="flex justify-between text-gray-600 text-sm">
                                    <span>المجموع (المشتريات)</span>
                                    <span>{order.subtotal.toLocaleString('ar-SA')} ر.ي</span>
                                  </div>
                                  <div className="flex justify-between text-gray-600 text-sm">
                                    <span>تكلفة الشحن</span>
                                    <span>{((order as any).shipping_cost || order.shippingCost || 0).toLocaleString('ar-SA')} ر.ي</span>
                                  </div>
                                  <div className="pt-2 border-t mt-2 flex justify-between font-bold text-gray-900">
                                    <span>الإجمالي</span>
                                    <span>{order.total.toLocaleString('ar-SA')} ر.ي</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <h4 className="font-semibold text-gray-900 mb-3">المنتجات ({items.length})</h4>
                            <div className="space-y-3">
                              {items.map((item: any) => (
                                <div key={item.id} className="flex items-center gap-4 bg-white p-3 rounded-lg border border-gray-200">
                                  <img src={item.productImage || item.product_image} alt={item.productName || item.product_name} className="w-16 h-16 object-cover rounded-md" />
                                  <div className="flex-1">
                                    <h5 className="font-medium text-gray-900">{item.productName || item.product_name}</h5>
                                    <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-1">
                                      {item.size && <span>المقاس: {item.size}</span>}
                                      {item.color && <span>اللون: {item.color}</span>}
                                      <span>الكمية: {item.quantity}</span>
                                    </div>
                                  </div>
                                  <div className="font-bold text-gray-900 text-sm">
                                    {(item.price * item.quantity).toLocaleString('ar-SA')} ر.ي
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
