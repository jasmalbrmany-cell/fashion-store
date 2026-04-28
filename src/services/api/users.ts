import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { User } from '@/types';
import { withTimeout, getFromCache, setToCache, clearCache, transformProfile } from './helpers';

export const usersService = {
  async getAll(): Promise<User[]> {
    const cached = getFromCache('users_all');
    if (cached) return cached;

    if (!isSupabaseConfigured()) {
      return [];
    }

    const { data, error } = await withTimeout((supabase as any)
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false }));

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    const transformed = (data || []).map(transformProfile);
    setToCache('users_all', transformed);
    return transformed;
  },

  async getById(id: string): Promise<User | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    const { data, error } = await (supabase as any)
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }

    return transformProfile(data);
  },

  async update(id: string, updates: Partial<User>): Promise<User | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    const fetchPromise = (supabase as any)
      .from('profiles')
      .update({
        name: updates.name,
        phone: updates.phone,
        role: updates.role,
        avatar: updates.avatar,
      })
      .eq('id', id)
      .select()
      .single();

    try {
      const { data, error } = await withTimeout(fetchPromise);
      if (error) {
        console.error('Error updating user:', error);
        return null;
      }
      clearCache('users_all');
      return transformProfile(data);
    } catch (e) {
      return null;
    }
  },

  async create(user: Partial<User>): Promise<User | null> {
    if (!isSupabaseConfigured() || !user.email) {
      return null;
    }
    try {
      const { data, error } = await withTimeout(
        (supabase as any).from('profiles').insert({
          id: user.id || undefined,
          email: user.email,
          name: user.name || user.email.split('@')[0],
          phone: user.phone || null,
          role: user.role || 'customer',
        }).select().single(),
        5000
      );
      if (error) {
        console.error('❌ Error creating user profile:', error);
        return null;
      }
      clearCache('users_all');
      return transformProfile(data);
    } catch (e: any) {
      console.error('❌ Exception creating user:', e);
      return null;
    }
  },

  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      return false;
    }
    const { error } = await (supabase as any).from('profiles').delete().eq('id', id);
    return !error;
  },

  async updateRole(id: string, role: string): Promise<User | null> {
    return this.update(id, { role: role as User['role'] });
  },
};
