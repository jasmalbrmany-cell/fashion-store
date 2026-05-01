import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Statistics } from '@/types';
import { getFromCache, setToCache } from './helpers';
import { activityLogsService } from './activity-logs';

export const statisticsService = {
  async get(): Promise<Statistics> {
    const cached = getFromCache('statistics_main');
    if (cached) return cached;

    if (!isSupabaseConfigured()) {
      return {
        totalProducts: 0,
        totalOrders: 0,
        todayOrders: 0,
        weekOrders: 0,
        monthOrders: 0,
        totalCustomers: 0,
        totalRevenue: 0,
        topProducts: [],
        recentActivities: [],
      };
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [productsRes, ordersRes, customersRes, todayOrdersRes, weekOrdersRes, monthOrdersRes, revenueRes, recentActivities] =
        await Promise.all([
          (supabase as any).from('products').select('id', { count: 'exact', head: true }),
          (supabase as any).from('orders').select('id', { count: 'exact', head: true }),
          (supabase as any).from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
          (supabase as any).from('orders').select('id', { count: 'exact', head: true }).gte('created_at', today),
          (supabase as any).from('orders').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),
          (supabase as any).from('orders').select('id', { count: 'exact', head: true }).gte('created_at', monthAgo),
          // Only fetch last 1000 orders for revenue to avoid massive payload
          (supabase as any).from('orders').select('total').eq('status', 'completed').order('created_at', { ascending: false }).limit(1000),
          activityLogsService.getRecent(5),
        ]);

      // Calculate revenue from fetched data
      const totalRevenue = (revenueRes.data || []).reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0);

      const transformed = {
        totalProducts: productsRes.count || 0,
        totalOrders: ordersRes.count || 0,
        todayOrders: todayOrdersRes.count || 0,
        weekOrders: weekOrdersRes.count || 0,
        monthOrders: monthOrdersRes.count || 0,
        totalCustomers: customersRes.count || 0,
        totalRevenue,
        topProducts: [],
        recentActivities,
      };

      setToCache('statistics_main', transformed);
      return transformed;
    } catch (e) {
      console.error('❌ Error fetching statistics:', e);
      return {
        totalProducts: 0,
        totalOrders: 0,
        todayOrders: 0,
        weekOrders: 0,
        monthOrders: 0,
        totalCustomers: 0,
        totalRevenue: 0,
        topProducts: [],
        recentActivities: [],
      };
    }
  },
};
