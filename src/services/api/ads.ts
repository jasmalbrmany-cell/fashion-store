import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Ad } from '@/types';
import { withTimeout, getFromCache, setToCache, transformAd } from './helpers';

export const adsService = {
  async getActive(): Promise<Ad[]> {
    const cached = getFromCache('ads_active');
    if (cached) return cached;

    if (!isSupabaseConfigured()) {
      return [];
    }

    const fetchPromise = (supabase as any)
      .from('ads')
      .select('*')
      .eq('is_active', true)
      .order('order', { ascending: true });

    try {
      const { data, error } = await withTimeout(fetchPromise);

      if (error) {
        console.error('Error fetching active ads:', error);
        return [];
      }

      const transformed = (data || []).map(transformAd);
      setToCache('ads_active', transformed);
      return transformed;
    } catch (e) {
      return [];
    }
  },

  async getAll(): Promise<Ad[]> {
    const cached = getFromCache('ads_all');
    if (cached) return cached;

    if (!isSupabaseConfigured()) {
      return [];
    }

    const fetchPromise = (supabase as any)
      .from('ads')
      .select('*')
      .order('order', { ascending: true });

    try {
      const { data, error } = await withTimeout(fetchPromise);

      if (error) {
        console.error('Error fetching ads:', error);
        return [];
      }

      const transformed = (data || []).map(transformAd);
      setToCache('ads_all', transformed);
      return transformed;
    } catch (e) {
      return [];
    }
  },

  async getById(id: string): Promise<Ad | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    const { data, error } = await (supabase as any)
      .from('ads')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching ad:', error);
      return null;
    }

    return transformAd(data);
  },

  async create(ad: Partial<Ad>): Promise<Ad | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    const { data, error } = await (supabase as any)
      .from('ads')
      .insert({
        title: ad.title || '',
        type: ad.type || 'image',
        content: ad.content,
        image_url: ad.imageUrl,
        video_url: ad.videoUrl,
        link: ad.link,
        position: ad.position || 'top',
        is_active: ad.isActive ?? true,
        order: ad.order || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating ad:', error);
      throw new Error(error.message);
    }

    return transformAd(data);
  },

  async update(id: string, updates: Partial<Ad>): Promise<Ad | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    const { data, error } = await (supabase as any)
      .from('ads')
      .update({
        title: updates.title,
        type: updates.type,
        content: updates.content,
        image_url: updates.imageUrl,
        video_url: updates.videoUrl,
        link: updates.link,
        position: updates.position,
        is_active: updates.isActive,
        order: updates.order,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating ad:', error);
      throw new Error(error.message);
    }

    return transformAd(data);
  },

  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      return false;
    }

    const { error } = await (supabase as any)
      .from('ads')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting ad:', error);
      return false;
    }

    return true;
  },
};
