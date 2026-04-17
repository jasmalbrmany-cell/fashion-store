import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, ShoppingCart, Users, TrendingUp, Clock,
  DollarSign, ArrowUp, UserPlus, Activity, RefreshCw,
  ShoppingBag, Eye, Loader2, ArrowRight
} from 'lucide-react';
import { statisticsService, productsService, ordersService, categoriesService, hasValidCache, getCachedSync } from '@/services/api';
import { Statistics, Product, Order, Category } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Skeleton, CardSkeleton, TableSkeleton } from '@/components/Common/Skeleton';
const SalesChart = lazy(() => import('@/components/Admin/DashboardCharts').then(module => ({ default: module.SalesChart })));
const CategoryChart = lazy(() => import('@/components/Admin/DashboardCharts').then(module => ({ default: module.CategoryChart })));
import { LowStockAlerts } from '@/components/Admin/LowStockAlerts';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t, isRTL, language } = useLanguage();
  const [stats, setStats] = useState<Statistics | null>(getCachedSync<Statistics>('statistics_main'));
  const [products, setProducts] = useState<Product[]>(getCachedSync<Product[]>('products_admin_all') || []);
  const [salesData, setSalesData] = useState<{name: string, total: number}[]>([]);
  const [categoryData, setCategoryData] = useState<{name: string, total: number}[]>([]);
  const [isLoading, setIsLoading] = useState(!hasValidCache('statistics_main') || !hasValidCache('products_admin_all'));
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchStats = async () => {
    if (!hasValidCache('statistics_main')) {
        setIsLoading(true);
    }
    try {
      const [statsData, productsData, orders, categories] = await Promise.all([
        statisticsService.get(),
        productsService.getAllAdmin(),
        ordersService.getAll(),
        categoriesService.getAll()
      ]);
      setStats(statsData);
      setProducts(productsData || []);
      
      // Compute Sales Data (Last 7 Days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return {
          date: d.toDateString(),
          name: d.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'short' }),
          total: 0
        };
      });

      orders.forEach(order => {
         const orderDate = new Date(order.createdAt).toDateString();
         const day = last7Days.find(d => d.date === orderDate);
         if (day && order.status === 'completed') {
            day.total += order.total;
         }
      });
      setSalesData(last7Days.map(d => ({ name: d.name, total: Math.round(d.total) })));

      // Compute Category Data
      const catCount = productsData.reduce((acc, p) => {
         acc[p.categoryId] = (acc[p.categoryId] || 0) + 1;
         return acc;
      }, {} as Record<string, number>);
      
      const computedCategoryData = Object.entries(catCount)
         .map(([catId, total]) => {
            const cat = categories.find(c => c.id === catId);
            return { name: cat ? cat.name : 'Unknown', total };
         })
         .sort((a, b) => b.total - a.total)
         .slice(0, 5); // Take top 5
      
      setCategoryData(computedCategoryData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      pending: { label: t.statusPending, color: 'bg-yellow-100 text-yellow-700' },
      waiting_payment: { label: t.statusWaitingPayment, color: 'bg-orange-100 text-orange-700' },
      paid: { label: t.statusPaid, color: 'bg-blue-100 text-blue-700' },
      approved: { label: t.statusApproved, color: 'bg-indigo-100 text-indigo-700' },
      completed: { label: t.statusCompleted, color: 'bg-green-100 text-green-700' },
      cancelled: { label: t.statusCancelled, color: 'bg-red-100 text-red-700' },
    };
    const info = map[status] || map.pending;
    return <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${info.color}`}>{info.label}</span>;
  };

  const displayStats = stats || {
    totalProducts: 0,
    totalOrders: 0,
    todayOrders: 0,
    weekOrders: 0,
    monthOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    topProducts: [],
    recentActivities: []
  };

  const statCards = [
    {
      icon: Package, color: 'text-blue-500', bg: 'bg-blue-50',
      label: t.adminProducts, value: displayStats.totalProducts,
      link: '/admin/products',
    },
    {
      icon: ShoppingCart, color: 'text-amber-500', bg: 'bg-amber-50',
      label: t.adminOrders, value: displayStats.totalOrders,
      link: '/admin/orders',
    },
    {
      icon: Users, color: 'text-purple-500', bg: 'bg-purple-50',
      label: t.adminUsers, value: displayStats.totalCustomers,
      link: '/admin/users',
    },
    {
      icon: DollarSign, color: 'text-green-500', bg: 'bg-green-50',
      label: t.totalRevenue, value: displayStats.totalRevenue.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US'),
      link: '/admin/orders',
    },
  ];

  return (
    <div className="space-y-8 pb-12" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">
            {t.adminDashboardTitle}
          </h1>
          <p className="text-gray-500 font-bold mt-1">
            {t.welcomeBack} <span className="text-black">{user?.name}</span> 👋
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-end hidden md:block">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.lastUpdated}</p>
            <p className="text-sm font-bold">{lastUpdated.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US')}</p>
          </div>
          <button
            onClick={fetchStats}
            disabled={isLoading}
            className="p-4 bg-white border-2 border-gray-100 rounded-2xl hover:border-black transition-all group shadow-sm active:scale-95"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
          </button>
        </div>
      </div>

      {/* Inventory Alerts */}
      <LowStockAlerts products={products} isLoading={isLoading} />

      {/* Modern Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading && !stats ? (
          <>
            <CardSkeleton /> <CardSkeleton /> <CardSkeleton /> <CardSkeleton />
          </>
        ) : (
          statCards.map((card, i) => (
            <Link
              key={i}
              to={card.link}
              className="bg-white rounded-3xl p-6 border-2 border-transparent hover:border-black transition-all shadow-sm group relative overflow-hidden"
            >
              <div className={`w-12 h-12 ${card.bg} ${card.color} rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-sm border border-gray-50`}>
                <card.icon className="w-6 h-6" />
              </div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{card.label}</p>
              <div className="flex items-end gap-2">
                <p className="text-3xl font-black text-gray-900 tracking-tighter">{card.value}</p>
                {card.label === t.totalRevenue && <span className="text-xs font-black text-gray-400 pb-1">{t.rial}</span>}
              </div>
              <ArrowRight className={`absolute bottom-6 ${isRTL ? 'left-6 rotate-180' : 'right-6'} w-5 h-5 opacity-0 group-hover:opacity-100 transition-all`} />
            </Link>
          ))
        )}
      </div>

      {/* Interactive Trends Section */}
      <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-3xl border-2 border-gray-100 p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tighter">{t.salesOverview}</h2>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t.last7Days}</p>
                </div>
                <div className="flex items-center gap-2 text-green-500 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-[10px] font-black">{t.statusCompleted || (isRTL ? 'مكتملة' : 'Completed')}</span>
                </div>
              </div>
              {isLoading && !stats ? <Skeleton className="h-[300px] w-full" /> : (
                <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
                  <SalesChart isRTL={isRTL} salesData={salesData} />
                </Suspense>
              )}
          </div>

          <div className="bg-white rounded-3xl border-2 border-gray-100 p-8 shadow-sm space-y-6">
              <h2 className="text-xl font-black text-gray-900 tracking-tighter">{t.topCategories || (isRTL ? 'أفضل الفئات' : 'Top Categories')}</h2>
              {isLoading && !stats ? <Skeleton className="h-[250px] w-full" /> : (
                <Suspense fallback={<Skeleton className="h-[250px] w-full" />}>
                  <CategoryChart isRTL={isRTL} categoryData={categoryData} />
                </Suspense>
              )}
              <div className="pt-4 border-t border-gray-50 space-y-3">
                  <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t.totalOrders}</span>
                      <span className="text-sm font-black">{displayStats.totalOrders}</span>
                  </div>
              </div>
          </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Activity Feed */}
        <div className="lg:col-span-2 bg-white rounded-3xl border-2 border-gray-100 overflow-hidden shadow-sm flex flex-col">
          <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-gray-900" />
              <h2 className="text-lg font-black text-gray-900 tracking-tighter">{t.recentActivities}</h2>
            </div>
            <Link to="/admin/activity" className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-black transition-colors">{t.fullLog}</Link>
          </div>
          <div className="divide-y divide-gray-50 flex-1 overflow-y-auto min-h-[400px]">
            {isLoading && !stats ? (
                <div className="p-8">
                    <TableSkeleton />
                </div>
            ) : (
                stats?.recentActivities && stats.recentActivities.length > 0 ? stats.recentActivities.map((activity) => (
                    <div key={activity.id} className="px-8 py-5 flex items-start gap-4 hover:bg-gray-50/50 transition-colors">
                        <div className="w-10 h-10 bg-gray-900 text-white rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm shadow-md">
                        {activity.userName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900">
                            <span className="font-black underline decoration-gray-200 underline-offset-4">{activity.userName}</span> {activity.action}
                        </p>
                        <p className="text-xs text-gray-400 font-bold uppercase mt-1">
                            {activity.details} • {new Date(activity.createdAt).toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        </div>
                    </div>
                )) : (
                    <div className="p-20 text-center opacity-20">
                        <Activity className="w-12 h-12 mx-auto mb-4" />
                        <p className="font-black uppercase tracking-widest text-xs">{t.noRecentActivity}</p>
                    </div>
                )
            )}
          </div>
        </div>

        {/* Quick Hub */}
        <div className="bg-gray-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10 space-y-8">
            <h2 className="text-xl font-black tracking-tighter">{t.quickActions}</h2>
            <div className="grid gap-4">
              {[
                { to: '/admin/products/add', icon: Package, label: t.addProductShort || (isRTL ? 'إضافة منتج' : 'Add Product'), color: 'bg-white/10 hover:bg-white text-white hover:text-black' },
                { to: '/admin/orders?status=pending', icon: Clock, label: isRTL ? 'طلبات معلقة' : 'Pending Orders', color: 'bg-amber-500 hover:bg-amber-400 text-black' },
                { to: '/admin/users', icon: UserPlus, label: t.adminUsers, color: 'bg-white/10 hover:bg-white text-white hover:text-black' },
                { to: '/admin/settings', icon: TrendingUp, label: t.adminSettings, color: 'bg-white/10 hover:bg-white text-white hover:text-black' },
              ].map((action, i) => (
                <Link
                  key={i}
                  to={action.to}
                  className={`flex items-center gap-4 p-4 rounded-2xl font-black text-sm transition-all active:scale-95 ${action.color}`}
                >
                  <action.icon className="w-5 h-5" />
                  {action.label}
                </Link>
              ))}
            </div>
            
            <div className="pt-8 border-t border-white/10 space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40">{t.securePersistence}</p>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs font-bold text-white/60">{t.dataEncrypted}</span>
                </div>
            </div>
          </div>
          <TrendingUp className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 rotate-12" />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
