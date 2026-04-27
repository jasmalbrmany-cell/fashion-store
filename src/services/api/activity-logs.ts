import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { ActivityLog } from '@/types';
import { transformActivityLog } from './helpers';

export const activityLogsService = {
  async getRecent(limit: number = 10): Promise<ActivityLog[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    const { data, error } = await (supabase as any)
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching activity logs:', error);
      return [];
    }

    return (data || []).map(transformActivityLog);
  },

  async create(action: string, details?: string): Promise<ActivityLog | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    const { data: sessionData } = await (supabase as any).auth.getSession();
    const userId = sessionData?.session?.user?.id;
    const userName = sessionData?.session?.user?.email?.split('@')[0] || 'System';

    const { data, error } = await (supabase as any)
      .from('activity_logs')
      .insert({
        user_id: userId,
        user_name: userName,
        action,
        details,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating activity log:', error);
      return null;
    }

    return transformActivityLog(data);
  },
};
