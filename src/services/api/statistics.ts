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

      // Fetch each stat individually to prevent one failure from breaking everything
      const fetchCount = async (table: string, queryModifier?: (q: any) => any) => {
        try {
          let q = (supabase as any).from(table).select('id', { count: 'exact', head: true });
          if (queryModifier) q = queryModifier(q);
          const { count, error } = await q;
          if (error) throw error;
          return count || 0;
        } catch (err) {
          console.warn(`[Stats] Failed to fetch count for ${table}:`, err);
          return 0;
        }
      };

      const [totalProducts, totalOrders, totalCustomers, todayOrders, weekOrders, monthOrders, revenueRes, recentActivities] =
        await Promise.all([
          fetchCount('products'),
          fetchCount('orders'),
          fetchCount('profiles', q => q.eq('role', 'customer')),
          fetchCount('orders', q => q.gte('created_at', today)),
          fetchCount('orders', q => q.gte('created_at', weekAgo)),
          fetchCount('orders', q => q.gte('created_at', monthAgo)),
          (supabase as any).from('orders').select('total').eq('status', 'completed').order('created_at', { ascending: false }).limit(1000).then((r: any) => r.data || []),
          activityLogsService.getRecent(5).catch(() => []),
        ]);

      const totalRevenue = revenueRes.reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0);

      const transformed = {
        totalProducts,
        totalOrders,
        todayOrders,
        weekOrders,
        monthOrders,
        totalCustomers: totalCustomers || 0,
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
