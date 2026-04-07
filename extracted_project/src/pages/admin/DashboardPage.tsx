import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, ShoppingCart, Users, TrendingUp, Clock,
  DollarSign, ArrowUp, UserPlus, Activity, RefreshCw,
  ShoppingBag, Eye
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { mockProducts, mockOrders, mockActivityLogs, mockUsers } from '@/data/mockData';

interface DashboardStats {
  totalProducts: number;
  visibleProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalCustomers: number;
  newCustomersToday: number;
  totalRevenue: number;
  monthRevenue: number;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0, visibleProducts: 0,
    totalOrders: 0, pendingOrders: 0,
    totalCustomers: 0, newCustomersToday: 0,
    totalRevenue: 0, monthRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      if (!isSupabaseConfigured()) {
        // Demo mode
        setStats({
          totalProducts: mockProducts.length,
          visibleProducts: mockProducts.filter(p => p.isVisible).length,
          totalOrders: mockOrders.length,
          pendingOrders: mockOrders.filter(o => o.status === 'pending').length,
          totalCustomers: mockUsers.filter(u => u.role === 'customer').length + 15,
          newCustomersToday: 3,
          totalRevenue: mockOrders.filter(o => o.status === 'completed').reduce((s, o) => s + o.total, 0),
          monthRevenue: mockOrders.filter(o => o.status === 'completed').reduce((s, o) => s + o.total, 0) * 0.4,
        });
        setRecentOrders(mockOrders.slice(0, 5));
        setRecentActivities(mockActivityLogs.slice(0, 6));
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

      const [products, orders, customers, newCustomers, activities] = await Promise.all([
        (supabase as any).from('products').select('id, is_visible'),
        (supabase as any).from('orders').select('id, status, total, customer_name, customer_phone, order_number, created_at').order('created_at', { ascending: false }).limit(5),
        (supabase as any).from('profiles').select('id, created_at').eq('role', 'customer'),
        (supabase as any).from('profiles').select('id').eq('role', 'customer').gte('created_at', today),
        (supabase as any).from('activity_logs').select('*').order('created_at', { ascending: false }).limit(6),
      ]);

      const allOrders = await (supabase as any).from('orders').select('status, total, created_at');
      const pendingOrders = (allOrders.data || []).filter((o: any) => o.status === 'pending').length;
      const completedOrders = (allOrders.data || []).filter((o: any) => o.status === 'completed');
      const totalRevenue = completedOrders.reduce((s: number, o: any) => s + (o.total || 0), 0);
      const monthRevenue = completedOrders
        .filter((o: any) => o.created_at >= monthStart)
        .reduce((s: number, o: any) => s + (o.total || 0), 0);

      const productsData = products.data || [];
      setStats({
        totalProducts: productsData.length,
        visibleProducts: productsData.filter((p: any) => p.is_visible).length,
        totalOrders: allOrders.data?.length || 0,
        pendingOrders,
        totalCustomers: customers.data?.length || 0,
        newCustomersToday: newCustomers.data?.length || 0,
        totalRevenue,
        monthRevenue,
      });
      setRecentOrders(orders.data || []);
      setRecentActivities(activities.data || mockActivityLogs.slice(0, 6));
      setLastUpdated(new Date());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      pending: { label: 'معلق', color: 'bg-yellow-100 text-yellow-700' },
      waiting_payment: { label: 'بانتظار الدفع', color: 'bg-orange-100 text-orange-700' },
      paid: { label: 'تم الدفع', color: 'bg-blue-100 text-blue-700' },
      approved: { label: 'موافق عليه', color: 'bg-indigo-100 text-indigo-700' },
      completed: { label: 'مكتمل', color: 'bg-green-100 text-green-700' },
      cancelled: { label: 'ملغي', color: 'bg-red-100 text-red-700' },
    };
    const info = map[status] || map.pending;
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${info.color}`}>{info.label}</span>;
  };

  const statCards = [
    {
      icon: Package, iconBg: 'bg-blue-100', iconColor: 'text-blue-600',
      label: 'المنتجات', value: stats.totalProducts,
      sub: `${stats.visibleProducts} مرئي`, trend: '+', trendColor: 'text-green-500',
      link: '/admin/products',
    },
    {
      icon: ShoppingCart, iconBg: 'bg-amber-100', iconColor: 'text-amber-600',
      label: 'الطلبات', value: stats.totalOrders,
      sub: stats.pendingOrders > 0 ? `${stats.pendingOrders} معلق ⚠️` : 'لا توجد طلبات معلقة',
      subColor: stats.pendingOrders > 0 ? 'text-amber-600 font-medium' : 'text-gray-400',
      link: '/admin/orders',
    },
    {
      icon: Users, iconBg: 'bg-purple-100', iconColor: 'text-purple-600',
      label: 'العملاء', value: stats.totalCustomers,
      sub: stats.newCustomersToday > 0 ? `+${stats.newCustomersToday} اليوم 🆕` : 'لا توجد تسجيلات جديدة',
      subColor: stats.newCustomersToday > 0 ? 'text-green-600 font-medium' : 'text-gray-400',
      link: '/admin/users',
    },
    {
      icon: DollarSign, iconBg: 'bg-green-100', iconColor: 'text-green-600',
      label: 'الإيرادات', value: stats.totalRevenue.toLocaleString('ar-SA'),
      sub: `هذا الشهر: ${stats.monthRevenue.toLocaleString('ar-SA')} ر.ي`,
      link: '/admin/orders',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
          <p className="text-gray-500 mt-1">
            مرحباً، <span className="font-medium text-gray-700">{user?.name}</span> 👋
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            آخر تحديث: {lastUpdated.toLocaleTimeString('ar-SA')}
          </span>
          <button
            onClick={fetchStats}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition text-sm font-medium text-gray-700"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <Link
            key={i}
            to={card.link}
            className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-11 h-11 ${card.iconBg} rounded-lg flex items-center justify-center group-hover:scale-110 transition`}>
                <card.icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
              {card.trend && (
                <span className={`text-sm flex items-center gap-0.5 ${card.trendColor}`}>
                  <ArrowUp className="w-3 h-3" />
                  {card.trend}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{card.value}</p>
            <p className="text-sm text-gray-500">{card.label}</p>
            {card.sub && (
              <p className={`text-xs mt-1 ${(card as any).subColor || 'text-gray-400'}`}>
                {card.sub}
              </p>
            )}
          </Link>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Recent Orders - 3 cols */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-gray-600" />
              <h2 className="font-semibold text-gray-900">آخر الطلبات</h2>
            </div>
            <Link to="/admin/orders" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              <Eye className="w-4 h-4" />
              عرض الكل
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">رقم الطلب</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">العميل</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">الإجمالي</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders.length > 0 ? recentOrders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm font-medium text-blue-600">
                      {order.orderNumber || order.order_number}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {order.customerName || order.customer_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {(order.total || 0).toLocaleString('ar-SA')} ر.ي
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(order.status)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-sm">
                      لا توجد طلبات بعد
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Log - 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-gray-600" />
              <h2 className="font-semibold text-gray-900">النشاطات الأخيرة</h2>
            </div>
            <Link to="/admin/activity" className="text-sm text-blue-600 hover:text-blue-700">
              الكل
            </Link>
          </div>
          <div className="divide-y divide-gray-100 overflow-y-auto max-h-72">
            {recentActivities.length > 0 ? recentActivities.map((activity: any) => (
              <div key={activity.id} className="px-5 py-3.5 flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-gray-600">
                  {(activity.userName || activity.user_name || 'A')?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 leading-relaxed">
                    <span className="font-medium">{activity.userName || activity.user_name}</span>{' '}
                    {activity.action}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(activity.createdAt || activity.created_at).toLocaleDateString('ar-SA')}
                  </p>
                </div>
              </div>
            )) : (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">
                لا توجد نشاطات بعد
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-gray-600" />
          إجراءات سريعة
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { to: '/admin/products/add', icon: Package, label: 'إضافة منتج', color: 'text-blue-600 bg-blue-50 hover:bg-blue-100' },
            { to: '/admin/users', icon: UserPlus, label: 'إضافة مستخدم', color: 'text-purple-600 bg-purple-50 hover:bg-purple-100' },
            { to: '/admin/orders?status=pending', icon: Clock, label: 'طلبات معلقة', color: 'text-amber-600 bg-amber-50 hover:bg-amber-100', badge: stats.pendingOrders },
            { to: '/admin/ads', icon: Activity, label: 'إدارة الإعلانات', color: 'text-green-600 bg-green-50 hover:bg-green-100' },
          ].map((action, i) => (
            <Link
              key={i}
              to={action.to}
              className={`relative flex flex-col items-center gap-2 p-5 rounded-xl ${action.color} transition`}
            >
              {action.badge && action.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {action.badge}
                </span>
              )}
              <action.icon className="w-7 h-7" />
              <span className="text-sm font-medium text-center">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
