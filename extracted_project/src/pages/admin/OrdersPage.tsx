import React, { useState } from 'react';
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
} from 'lucide-react';
import { mockOrders } from '@/data/mockData';
import { Order, OrderStatus } from '@/types';
import { mockStoreSettings } from '@/data/mockData';

const AdminOrdersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || '');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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
      pending: { label: 'قيد الانتظار', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
      waiting_payment: { label: 'بانتظار الدفع', color: 'text-orange-700', bgColor: 'bg-orange-100' },
      paid: { label: 'تم الدفع', color: 'text-blue-700', bgColor: 'bg-blue-100' },
      approved: { label: 'تمت الموافقة', color: 'text-green-700', bgColor: 'bg-green-100' },
      completed: { label: 'مكتمل', color: 'text-green-800', bgColor: 'bg-green-200' },
      cancelled: { label: 'ملغي', color: 'text-red-700', bgColor: 'bg-red-100' },
    };
    return statusMap[status];
  };

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders(prev =>
      prev.map(o =>
        o.id === orderId
          ? { ...o, status: newStatus, updatedAt: new Date().toISOString() }
          : o
      )
    );
    setMenuOpen(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('ar-SA');
  };

  const handleWhatsAppContact = (phone: string, orderNumber: string) => {
    const message = `مرحباً، بخصوص طلبك ${orderNumber}. نحن بصدد مراجعة طلبك. هل يمكنك تأكيد طريقة الدفع المناسبة لك؟`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleGenerateInvoice = (order: Order) => {
    // In a real app, this would generate a PDF
    alert(`تم إنشاء فاتورة للطلب ${order.orderNumber}`);
    setSelectedOrder(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">الطلبات</h1>
        <p className="text-gray-500">{orders.length} طلب</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="ابحث برقم الطلب أو اسم العميل أو الجوال..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">جميع الحالات</option>
            <option value="pending">قيد الانتظار</option>
            <option value="waiting_payment">بانتظار الدفع</option>
            <option value="paid">تم الدفع</option>
            <option value="approved">تمت الموافقة</option>
            <option value="completed">مكتمل</option>
            <option value="cancelled">ملغي</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">رقم الطلب</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العميل</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المنتجات</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجمالي</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-medium text-primary-600">{order.orderNumber}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{order.customerName}</p>
                      <p className="text-sm text-gray-500" dir="ltr">{order.customerPhone}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {order.items.length} منتج
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900">
                      {formatPrice(order.total)} ر.ي
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(order.status).bgColor} ${getStatusBadge(order.status).color}`}>
                      {getStatusBadge(order.status).label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                        title="عرض التفاصيل"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleWhatsAppContact(order.customerPhone, order.orderNumber)}
                        className="p-2 hover:bg-green-50 rounded-lg text-green-600"
                        title="تواصل واتساب"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setMenuOpen(menuOpen === order.id ? null : order.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>

                        {menuOpen === order.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setMenuOpen(null)}
                            />
                            <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-20">
                              {order.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => updateOrderStatus(order.id, 'waiting_payment')}
                                    className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-orange-600"
                                  >
                                    <Clock className="w-4 h-4" />
                                    بانتظار الدفع
                                  </button>
                                  <button
                                    onClick={() => updateOrderStatus(order.id, 'cancelled')}
                                    className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-red-600"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    إلغاء الطلب
                                  </button>
                                </>
                              )}
                              {order.status === 'waiting_payment' && (
                                <>
                                  <button
                                    onClick={() => updateOrderStatus(order.id, 'paid')}
                                    className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-blue-600"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    تم الدفع
                                  </button>
                                  <button
                                    onClick={() => updateOrderStatus(order.id, 'cancelled')}
                                    className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-red-600"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    إلغاء الطلب
                                  </button>
                                </>
                              )}
                              {order.status === 'paid' && (
                                <button
                                  onClick={() => updateOrderStatus(order.id, 'approved')}
                                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-green-600"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  موافقة على الطلب
                                </button>
                              )}
                              {order.status === 'approved' && (
                                <button
                                  onClick={() => updateOrderStatus(order.id, 'completed')}
                                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-green-600"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  تسليم الطلب
                                </button>
                              )}
                              <button
                                onClick={() => handleGenerateInvoice(order)}
                                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100"
                              >
                                <FileText className="w-4 h-4" />
                                إنشاء فاتورة
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-gray-500">لا توجد طلبات</p>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedOrder.orderNumber}</h2>
                <p className="text-sm text-gray-500">{formatDate(selectedOrder.createdAt)}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XCircle className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-gray-600">الحالة:</span>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusBadge(selectedOrder.status).bgColor} ${getStatusBadge(selectedOrder.status).color}`}>
                  {getStatusBadge(selectedOrder.status).label}
                </span>
              </div>

              {/* Customer Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">معلومات العميل</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">الاسم</p>
                    <p className="font-medium">{selectedOrder.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">الجوال</p>
                    <p className="font-medium" dir="ltr">{selectedOrder.customerPhone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">المدينة</p>
                    <p className="font-medium">{selectedOrder.city}</p>
                  </div>
                  {selectedOrder.address && (
                    <div>
                      <p className="text-sm text-gray-500">العنوان</p>
                      <p className="font-medium">{selectedOrder.address}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">المنتجات</h3>
                <div className="space-y-4">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.productName}</p>
                        <p className="text-sm text-gray-500">
                          {item.size && `المقاس: ${item.size}`}
                          {item.size && item.color && ' / '}
                          {item.color && `اللون: ${item.color}`}
                        </p>
                        <p className="text-sm text-gray-500">الكمية: {item.quantity}</p>
                        <p className="font-semibold text-primary-600">
                          {formatPrice(item.price * item.quantity)} ر.ي
                        </p>
                        {item.sourceUrl && (
                          <a
                            href={item.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            المصدر
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">المجموع الفرعي</span>
                  <span>{formatPrice(selectedOrder.subtotal)} ر.ي</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">الشحن</span>
                  <span>{formatPrice(selectedOrder.shippingCost)} ر.ي</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>الإجمالي</span>
                  <span className="text-primary-600">{formatPrice(selectedOrder.total)} ر.ي</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t flex justify-between">
              <button
                onClick={() => handleGenerateInvoice(selectedOrder)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Download className="w-5 h-5" />
                تحميل الفاتورة
              </button>
              <button
                onClick={() => handleWhatsAppContact(selectedOrder.customerPhone, selectedOrder.orderNumber)}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                <MessageCircle className="w-5 h-5" />
                تواصل مع العميل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;
