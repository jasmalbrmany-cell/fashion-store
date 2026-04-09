import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  MessageCircle,
  FileText,
  Download,
  MoreVertical,
  Clock,
  Phone,
  Loader2,
  Package
} from 'lucide-react';
import { ordersService, hasValidCache, getCachedSync } from '@/services/api';
import { Order, OrderStatus } from '@/types';
import { useLanguage } from '@/context/LanguageContext';

const AdminOrdersPage: React.FC = () => {
  const { t, language, isRTL } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>(getCachedSync<Order[]>('orders_all') || []);
  const [loading, setLoading] = useState(!hasValidCache('orders_all'));
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || '');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (!hasValidCache('orders_all')) {
            setLoading(true);
        }
        const data = await ordersService.getAll();
        setOrders(data);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone.includes(searchQuery);
    const matchesStatus = !statusFilter || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: OrderStatus) => {
    const statusMap: Record<OrderStatus, { label: string; color: string; bgColor: string }> = {
      pending: { label: t.statusPending, color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
      waiting_payment: { label: t.statusWaitingPayment, color: 'text-orange-700', bgColor: 'bg-orange-100' },
      paid: { label: t.statusPaid, color: 'text-blue-700', bgColor: 'bg-blue-100' },
      approved: { label: t.statusApproved, color: 'text-green-700', bgColor: 'bg-green-100' },
      completed: { label: t.statusCompleted, color: 'text-teal-700', bgColor: 'bg-teal-100' },
      cancelled: { label: t.statusCancelled, color: 'text-red-700', bgColor: 'bg-red-100' },
    };
    return statusMap[status] || statusMap.pending;
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
        const updated = await ordersService.updateStatus(orderId, newStatus);
        if (updated) {
            setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
        }
    } catch (err) {
        console.error('Failed to update status', err);
    }
    setMenuOpen(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US');
  };

  const handleWhatsAppContact = (phone: string, orderNumber: string) => {
    const message = language === 'ar' 
      ? `مرحباً، بخصوص طلبك ${orderNumber}. نحن بصدد مراجعة طلبك. هل يمكنك تأكيد طريقة الدفع المناسبة لك؟`
      : `Hello, regarding your order ${orderNumber}. We are processing it. Could you confirm your payment method?`;
    window.open(`https://wa.me/${phone.replace(/\+/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleGenerateInvoice = (order: Order) => {
    alert(isRTL ? `تم إنشاء فاتورة للطلب ${order.orderNumber}` : `Invoice generated for order ${order.orderNumber}`);
    setSelectedOrder(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-black" />
        <p className="font-bold text-gray-400 animate-pulse">{t.loadingOrders}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-900">{t.adminOrders}</h1>
          <p className="text-gray-500 font-bold">{orders.length} {t.ordersCount}</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-3xl shadow-sm border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5`} />
            <input
              type="text"
              placeholder={t.searchOrders}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full ${isRTL ? 'pr-12' : 'pl-12'} py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black outline-none font-bold`}
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-6 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black outline-none font-bold appearance-none min-w-[200px]"
          >
            <option value="">{t.allStatuses}</option>
            <option value="pending">{t.statusPending}</option>
            <option value="waiting_payment">{t.statusWaitingPayment}</option>
            <option value="paid">{t.statusPaid}</option>
            <option value="approved">{t.statusApproved}</option>
            <option value="completed">{t.statusCompleted}</option>
            <option value="cancelled">{t.statusCancelled}</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-5 text-start text-xs font-black text-gray-400 uppercase tracking-widest">{t.orderNumber}</th>
                <th className="px-6 py-5 text-start text-xs font-black text-gray-400 uppercase tracking-widest">{t.customer}</th>
                <th className="px-6 py-5 text-start text-xs font-black text-gray-400 uppercase tracking-widest">{t.products}</th>
                <th className="px-6 py-5 text-start text-xs font-black text-gray-400 uppercase tracking-widest">{t.total}</th>
                <th className="px-6 py-5 text-start text-xs font-black text-gray-400 uppercase tracking-widest">{t.date}</th>
                <th className="px-6 py-5 text-start text-xs font-black text-gray-400 uppercase tracking-widest">{t.status}</th>
                <th className="px-6 py-5 text-center text-xs font-black text-gray-400 uppercase tracking-widest">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map((order) => {
                const badge = getStatusBadge(order.status);
                return (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-black text-black">#{order.orderNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-black text-gray-900">{order.customerName}</p>
                        <p className="text-xs text-gray-400 font-bold" dir="ltr">{order.customerPhone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-gray-600 px-3 py-1 bg-gray-100 rounded-lg">
                        {order.items.length} {t.productCount}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-black text-black">
                        {formatPrice(order.total)} {t.rial}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-gray-500">
                        {formatDate(order.createdAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${badge.bgColor} ${badge.color}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 hover:bg-black hover:text-white rounded-xl transition-all border border-gray-100"
                          title={t.orderDetails}
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleWhatsAppContact(order.customerPhone, order.orderNumber)}
                          className="p-2 hover:bg-green-50 text-green-600 rounded-xl transition-all border border-gray-100"
                          title={t.contactWhatsApp}
                        >
                          <MessageCircle className="w-5 h-5" />
                        </button>
                        <div className="relative">
                          <button
                            onClick={() => setMenuOpen(menuOpen === order.id ? null : order.id)}
                            className={`p-2 rounded-xl transition-all border border-gray-100 ${menuOpen === order.id ? 'bg-black text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
  
                          {menuOpen === order.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                              <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 z-20 py-2 animate-in fade-in zoom-in-95`}>
                                {order.status === 'pending' && (
                                  <>
                                    <button onClick={() => updateOrderStatus(order.id, 'waiting_payment')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50 text-orange-600 text-sm font-black border-b border-gray-50 transition-colors">
                                      <Clock className="w-4 h-4" /> {t.waitingPayment}
                                    </button>
                                    <button onClick={() => updateOrderStatus(order.id, 'cancelled')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-red-600 text-sm font-black transition-colors">
                                      <XCircle className="w-4 h-4" /> {t.cancelOrder}
                                    </button>
                                  </>
                                )}
                                {order.status === 'waiting_payment' && (
                                  <>
                                    <button onClick={() => updateOrderStatus(order.id, 'paid')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-blue-600 text-sm font-black border-b border-gray-50 transition-colors">
                                      <CheckCircle className="w-4 h-4" /> {t.paid}
                                    </button>
                                    <button onClick={() => updateOrderStatus(order.id, 'cancelled')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-red-600 text-sm font-black transition-colors">
                                      <XCircle className="w-4 h-4" /> {t.cancelOrder}
                                    </button>
                                  </>
                                )}
                                {order.status === 'paid' && (
                                  <button onClick={() => updateOrderStatus(order.id, 'approved')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-green-50 text-green-600 text-sm font-black transition-colors">
                                    <CheckCircle className="w-4 h-4" /> {t.approveOrder}
                                  </button>
                                )}
                                {order.status === 'approved' && (
                                  <button onClick={() => updateOrderStatus(order.id, 'completed')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-teal-50 text-teal-600 text-sm font-black transition-colors">
                                    <CheckCircle className="w-4 h-4" /> {t.completeOrder}
                                  </button>
                                )}
                                <button onClick={() => handleGenerateInvoice(order)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 text-sm font-black mt-1">
                                  <FileText className="w-4 h-4" /> {t.generateInvoice}
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="py-20 text-center space-y-4">
             <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                <Package className="w-10 h-10" />
             </div>
             <p className="text-gray-400 font-bold">{t.noOrdersYet}</p>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95">
            {/* Header */}
            <div className="px-8 py-6 border-b flex items-center justify-between bg-gray-50/50">
              <div>
                <h2 className="text-2xl font-black text-gray-900">#{selectedOrder.orderNumber}</h2>
                <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">{formatDate(selectedOrder.createdAt)}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-3 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-gray-100 shadow-sm"
              >
                <XCircle className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 space-y-8 overflow-y-auto">
              {/* Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <span className="text-xs font-black uppercase text-gray-400 tracking-widest">{t.status}:</span>
                <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${getStatusBadge(selectedOrder.status).bgColor} ${getStatusBadge(selectedOrder.status).color}`}>
                  {getStatusBadge(selectedOrder.status).label}
                </span>
              </div>

              {/* Customer Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2"><Phone className="w-5 h-5" /> {t.customerInfo}</h3>
                <div className="grid grid-cols-2 gap-6 p-6 bg-gray-50 rounded-3xl border border-gray-100">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.customer}</p>
                    <p className="font-black text-gray-900">{selectedOrder.customerName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.mobile}</p>
                    <p className="font-black text-gray-900" dir="ltr">{selectedOrder.customerPhone}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{language === 'ar' ? 'المدينة' : 'City'}</p>
                    <p className="font-black text-gray-900">{selectedOrder.city}</p>
                  </div>
                  {selectedOrder.address && (
                    <div className="space-y-1 col-span-2">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.address}</p>
                      <p className="font-black text-gray-900">{selectedOrder.address}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Items */}
              <div className="space-y-4">
                <h3 className="text-lg font-black text-gray-900">{t.products}</h3>
                <div className="grid gap-4">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex gap-4 p-4 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden border border-gray-50">
                        <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                            <p className="font-black text-gray-900 text-lg leading-tight">{item.productName}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {item.size && <span className="text-[10px] font-black bg-gray-100 px-2 py-0.5 rounded uppercase">{t.size}: {item.size}</span>}
                                {item.color && <span className="text-[10px] font-black bg-gray-100 px-2 py-0.5 rounded uppercase">{t.color}: {item.color}</span>}
                            </div>
                        </div>
                        <div className="flex justify-between items-end">
                            <p className="text-sm font-bold text-gray-400">{t.qtyLabel} {item.quantity}</p>
                            <p className="font-black text-black text-lg">
                                {formatPrice(item.price * item.quantity)} {t.rial}
                            </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-black text-white p-8 rounded-[2.5rem] space-y-4 shadow-xl shadow-black/10">
                <div className="flex justify-between text-gray-400 font-bold">
                  <span>{t.subtotal}</span>
                  <span>{formatPrice(selectedOrder.subtotal)} {t.rial}</span>
                </div>
                <div className="flex justify-between text-gray-400 font-bold">
                  <span>{t.shipping}</span>
                  <span>{formatPrice(selectedOrder.shippingCost)} {t.rial}</span>
                </div>
                <div className="flex justify-between text-2xl font-black pt-4 border-t border-white/10">
                  <span>{t.total}</span>
                  <span className="text-white">{formatPrice(selectedOrder.total)} {t.rial}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-8 py-6 border-t bg-gray-50/50 flex flex-col md:flex-row gap-4 mt-auto">
              <button
                onClick={() => handleGenerateInvoice(selectedOrder)}
                className="flex-1 flex items-center justify-center gap-3 px-6 py-4 border-2 border-gray-200 rounded-2xl hover:border-black transition-all font-black uppercase tracking-widest text-sm"
              >
                <Download className="w-5 h-5" />
                {t.downloadInvoice}
              </button>
              <button
                onClick={() => handleWhatsAppContact(selectedOrder.customerPhone, selectedOrder.orderNumber)}
                className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-green-500 text-white rounded-2xl hover:bg-green-600 transition-all font-black uppercase tracking-widest text-sm shadow-xl shadow-green-100"
              >
                <MessageCircle className="w-5 h-5" />
                {t.contactCustomer}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;
