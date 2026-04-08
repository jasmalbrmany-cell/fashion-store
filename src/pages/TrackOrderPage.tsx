import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Package, CheckCircle, Clock, XCircle, ChevronRight, Phone } from 'lucide-react';
import { mockOrders } from '@/data/mockData';
import { Order, OrderStatus } from '@/types';
import { mockStoreSettings } from '@/data/mockData';

const TrackOrderPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    // Search by order number or phone
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
      pending: { label: 'قيد الانتظار', color: 'text-yellow-600 bg-yellow-100', icon: <Clock className="w-5 h-5" /> },
      waiting_payment: { label: 'بانتظار الدفع', color: 'text-orange-600 bg-orange-100', icon: <Clock className="w-5 h-5" /> },
      paid: { label: 'تم الدفع', color: 'text-blue-600 bg-blue-100', icon: <CheckCircle className="w-5 h-5" /> },
      approved: { label: 'تمت الموافقة', color: 'text-green-600 bg-green-100', icon: <CheckCircle className="w-5 h-5" /> },
      completed: { label: 'مكتمل', color: 'text-green-700 bg-green-200', icon: <CheckCircle className="w-5 h-5" /> },
      cancelled: { label: 'ملغي', color: 'text-red-600 bg-red-100', icon: <XCircle className="w-5 h-5" /> },
    };
    return statusMap[status];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
          تتبع الطلب
        </h1>

        {/* Search Form */}
        <div className="max-w-xl mx-auto mb-12">
          <form onSubmit={handleSearch} className="bg-white rounded-lg shadow-sm p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              أدخل رقم الطلب أو رقم الجوال
            </label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="مثال: ORD-2025-001 أو 777123456"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700"
              >
                بحث
              </button>
            </div>
          </form>
        </div>

        {/* Not Found */}
        {notFound && (
          <div className="max-w-xl mx-auto bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">لم يتم العثور على الطلب</h3>
            <p className="text-gray-500">
              تأكد من صحة رقم الطلب أو رقم الجوال وحاول مرة أخرى
            </p>
          </div>
        )}

        {/* Found Order */}
        {foundOrder && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Header */}
              <div className="bg-primary-600 text-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-80">رقم الطلب</p>
                    <p className="text-2xl font-bold">{foundOrder.orderNumber}</p>
                  </div>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${getStatusInfo(foundOrder.status).color}`}>
                    {getStatusInfo(foundOrder.status).icon}
                    <span className="font-medium">{getStatusInfo(foundOrder.status).label}</span>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="p-6 border-b">
                <h3 className="font-semibold text-gray-900 mb-4">تتبع الطلب</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">تم استلام الطلب</p>
                      <p className="text-sm text-gray-500">{formatDate(foundOrder.createdAt)}</p>
                    </div>
                  </div>

                  {(foundOrder.status === 'paid' || foundOrder.status === 'approved' || foundOrder.status === 'completed') && (
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">تم تأكيد الدفع</p>
                        <p className="text-sm text-gray-500">{formatDate(foundOrder.updatedAt)}</p>
                      </div>
                    </div>
                  )}

                  {foundOrder.status === 'completed' && (
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">تم التسليم</p>
                        <p className="text-sm text-gray-500">{formatDate(foundOrder.updatedAt)}</p>
                      </div>
                    </div>
                  )}

                  {foundOrder.status === 'cancelled' && (
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white">
                        <XCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">تم إلغاء الطلب</p>
                        <p className="text-sm text-gray-500">{formatDate(foundOrder.updatedAt)}</p>
                      </div>
                    </div>
                  )}

                  {(foundOrder.status === 'pending' || foundOrder.status === 'waiting_payment') && (
                    <div className="flex items-start gap-4 opacity-60">
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-500">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-500">في الانتظار</p>
                        <p className="text-sm text-gray-400">جارٍ التواصل معك</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Details */}
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">تفاصيل الطلب</h3>

                {/* Customer Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">الاسم</p>
                      <p className="font-medium">{foundOrder.customerName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">الجوال</p>
                      <p className="font-medium" dir="ltr">{foundOrder.customerPhone}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">المدينة</p>
                      <p className="font-medium">{foundOrder.city}</p>
                    </div>
                    {foundOrder.address && (
                      <div>
                        <p className="text-gray-500">العنوان</p>
                        <p className="font-medium">{foundOrder.address}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-4 mb-6">
                  {foundOrder.items.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.productName}</h4>
                        <p className="text-sm text-gray-500">
                          {item.size && `المقاس: ${item.size}`}
                          {item.size && item.color && ' / '}
                          {item.color && `اللون: ${item.color}`}
                        </p>
                        <p className="text-sm text-gray-500">الكمية: {item.quantity}</p>
                        <p className="font-semibold text-primary-600">
                          {(item.price * item.quantity).toLocaleString('ar-SA')} ر.ي
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">المجموع الفرعي</span>
                    <span>{foundOrder.subtotal.toLocaleString('ar-SA')} ر.ي</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">الشحن</span>
                    <span>{foundOrder.shippingCost.toLocaleString('ar-SA')} ر.ي</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>الإجمالي</span>
                    <span className="text-primary-600">{foundOrder.total.toLocaleString('ar-SA')} ر.ي</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="mt-6 text-center">
              <p className="text-gray-500 mb-4">هل لديك استفسار؟ تواصل معنا</p>
              <a
                href={`https://wa.me/${mockStoreSettings.socialLinks.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600"
              >
                <Phone className="w-5 h-5" />
                تواصل عبر واتساب
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackOrderPage;
