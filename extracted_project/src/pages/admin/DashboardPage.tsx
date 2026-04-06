import React from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { mockProducts, mockOrders, mockActivityLogs, mockUsers } from '@/data/mockData';

const DashboardPage: React.FC = () => {
  const stats = {
    totalProducts: mockProducts.length,
    visibleProducts: mockProducts.filter(p => p.isVisible).length,
    totalOrders: mockOrders.length,
    pendingOrders: mockOrders.filter(o => o.status === 'pending').length,
    totalCustomers: mockUsers.filter(u => u.role === 'customer').length + 15, // Mock additional customers
    totalRevenue: mockOrders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + o.total, 0),
  };

  const recentOrders = mockOrders.slice(0, 5);
  const recentActivities = mockActivityLogs.slice(0, 5);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      pending: { label: 'قيد الانتظار', color: 'bg-yellow-100 text-yellow-700' },
      waiting_payment: { label: 'بانتظار الدفع', color: 'bg-orange-100 text-orange-700' },
      paid: { label: 'تم الدفع', color: 'bg-blue-100 text-blue-700' },
      approved: { label: 'تمت الموافقة', color: 'bg-green-100 text-green-700' },
      completed: { label: 'مكتمل', color: 'bg-green-200 text-green-800' },
      cancelled: { label: 'ملغي', color: 'bg-red-100 text-red-700' },
    };
    const info = statusMap[status] || statusMap.pending;
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${info.color}`}>{info.label}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
        <p className="text-gray-500">مرحباً، {mockUsers[0].name}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-green-500 text-sm flex items-center">
              <ArrowUp className="w-4 h-4" />
              12%
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
          <p className="text-gray-500 text-sm">إجمالي المنتجات</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-green-600" />
            </div>
            {stats.pendingOrders > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {stats.pendingOrders}
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
          <p className="text-gray-500 text-sm">إجمالي الطلبات</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-green-500 text-sm flex items-center">
              <ArrowUp className="w-4 h-4" />
              8%
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
          <p className="text-gray-500 text-sm">إجمالي العملاء</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary-600" />
            </div>
            <span className="text-green-500 text-sm flex items-center">
              <ArrowUp className="w-4 h-4" />
              15%
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stats.totalRevenue.toLocaleString('ar-SA')}
          </p>
          <p className="text-gray-500 text-sm">الإيرادات (ر.ي)</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">آخر الطلبات</h2>
            <Link to="/admin/orders" className="text-primary-600 hover:text-primary-700 text-sm">
              عرض الكل
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">رقم الطلب</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العميل</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجمالي</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-primary-600">
                      <Link to={`/admin/orders/${order.id}`}>{order.orderNumber}</Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{order.customerName}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {order.total.toLocaleString('ar-SA')} ر.ي
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">آخر النشاطات</h2>
            <Link to="/admin/activity" className="text-primary-600 hover:text-primary-700 text-sm">
              عرض الكل
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="px-6 py-4 flex items-start gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.userName}</span>{' '}
                    {activity.action}
                  </p>
                  {activity.details && (
                    <p className="text-sm text-gray-500 truncate">{activity.details}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(activity.createdAt).toLocaleDateString('ar-SA')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">إجراءات سريعة</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/admin/products/add"
            className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-primary-50 transition"
          >
            <Package className="w-8 h-8 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">إضافة منتج</span>
          </Link>
          <Link
            to="/admin/products/import"
            className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-primary-50 transition"
          >
            <TrendingUp className="w-8 h-8 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">استيراد منتج</span>
          </Link>
          <Link
            to="/admin/orders?status=pending"
            className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-primary-50 transition"
          >
            <ShoppingCart className="w-8 h-8 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">طلبات معلقة</span>
          </Link>
          <Link
            to="/admin/settings"
            className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg hover:bg-primary-50 transition"
          >
            <DollarSign className="w-8 h-8 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">إعدادات المتجر</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
