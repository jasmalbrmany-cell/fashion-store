import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { City } from '@/types';
import { withTimeout, getFromCache, setToCache, clearCache, transformCity } from './helpers';

export const citiesService = {
  async getAll(): Promise<City[]> {
    const cached = getFromCache('cities_all');
    if (cached) return cached;

    if (!isSupabaseConfigured()) {
      return [];
    }

    const fetchPromise = (supabase as any)
      .from('cities')
      .select('*')
      .order('name', { ascending: true });

    try {
      const { data, error } = await withTimeout(fetchPromise, 10000);

      if (error) {
        console.error('Error fetching cities:', error);
        return [];
      }

      const results = (data || []).map(transformCity);
      const uniqueResults: City[] = [];
      const seenNames = new Set<string>();

      for (const city of results) {
        const nameKey = city.name.trim().toLowerCase();
        if (!seenNames.has(nameKey)) {
          seenNames.add(nameKey);
          uniqueResults.push(city);
        }
      }

      setToCache('cities_all', uniqueResults);
      return uniqueResults;
    } catch (e) {
      return [];
    }
  },

  async getActive(): Promise<City[]> {
    const cached = getFromCache('cities_active');
    if (cached) return cached;

    if (!isSupabaseConfigured()) {
      return [];
    }

    const fetchPromise = (supabase as any)
      .from('cities')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    try {
      const { data, error } = await withTimeout(fetchPromise, 10000);

      if (error) {
        console.error('Error fetching active cities:', error);
        return [];
      }

      const results = (data || []).map(transformCity);
      const uniqueResults: City[] = [];
      const seenNames = new Set<string>();

      for (const city of results) {
        const nameKey = city.name.trim().toLowerCase();
        if (!seenNames.has(nameKey)) {
          seenNames.add(nameKey);
          uniqueResults.push(city);
        }
      }

      setToCache('cities_active', uniqueResults);
      return uniqueResults;
    } catch (e) {
      return [];
    }
  },

  async getById(id: string): Promise<City | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    const { data, error } = await (supabase as any)
      .from('cities')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching city:', error);
      return null;
    }

    return transformCity(data);
  },

  async create(city: Partial<City>): Promise<City | null> {
    try {
      const fetchPromise = (supabase as any)
        .from('cities')
        .insert({
          name: city.name || '',
          shipping_cost: city.shippingCost || 0,
          is_active: city.isActive ?? true,
        })
        .select()
        .single();

      const { data, error } = await withTimeout(fetchPromise, 8000);

      if (error) {
        const errorMsg = error.message || 'فشل إنشاء المدينة';
        console.error('❌ Error creating city:', error);
        throw new Error(errorMsg);
      }

      clearCache('cities_all');
      clearCache('cities_active');
      return transformCity(data);
    } catch (e: any) {
      const errorMessage = e?.message || 'خطأ غير متوقع عند إنشاء المدينة';
      console.error('❌ Exception creating city:', errorMessage);
      throw new Error(errorMessage);
    }
  },

  async update(id: string, updates: Partial<City>): Promise<City | null> {
    try {
      const fetchPromise = (supabase as any)
        .from('cities')
        .update({
          name: updates.name,
          shipping_cost: updates.shippingCost,
          is_active: updates.isActive,
        })
        .eq('id', id)
        .select()
        .single();

      const { data, error } = await withTimeout(fetchPromise, 8000);

      if (error) {
        const errorMsg = error.message || 'فشل تحديث المدينة';
        console.error('❌ Error updating city:', error);
        throw new Error(errorMsg);
      }

      clearCache('cities_all');
      clearCache('cities_active');
      return transformCity(data);
    } catch (e: any) {
      const errorMessage = e?.message || 'خطأ غير متوقع عند تحديث المدينة';
      console.error('❌ Exception updating city:', errorMessage);
      throw new Error(errorMessage);
    }
  },

  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      return false;
    }

    try {
      const fetchPromise = (supabase as any)
        .from('cities')
        .delete()
        .eq('id', id);

      const { error } = await withTimeout(fetchPromise, 8000);

      if (error) {
        const errorMsg = error.message || 'فشل حذف المدينة';
        console.error('❌ Error deleting city:', error);
        throw new Error(errorMsg);
      }

      clearCache('cities_all');
      clearCache('cities_active');
      return true;
    } catch (e: any) {
      const errorMessage = e?.message || 'خطأ غير متوقع عند حذف المدينة';
      console.error('❌ Exception deleting city:', errorMessage);
      throw new Error(errorMessage);
    }
  },
};
