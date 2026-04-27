import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Currency } from '@/types';
import { withTimeout, getFromCache, setToCache, clearCache, transformCurrency } from './helpers';

export const currenciesService = {
  async getAll(): Promise<Currency[]> {
    const cached = getFromCache('currencies_all');
    if (cached) return cached;

    if (!isSupabaseConfigured()) {
      return [];
    }

    const fetchPromise = (supabase as any)
      .from('currencies')
      .select('*')
      .order('code', { ascending: true });

    try {
      const { data, error } = await withTimeout(fetchPromise, 10000);

      if (error) {
        console.error('Error fetching currencies:', error);
        return [];
      }

      const transformed = (data || []).map(transformCurrency);
      setToCache('currencies_all', transformed);
      return transformed;
    } catch (e) {
      return [];
    }
  },

  async getByCode(code: string): Promise<Currency | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    const { data, error } = await (supabase as any)
      .from('currencies')
      .select('*')
      .eq('code', code)
      .single();

    if (error) {
      console.error('Error fetching currency:', error);
      return null;
    }

    return transformCurrency(data);
  },

  async create(currency: Partial<Currency>): Promise<Currency | null> {
    try {
      const fetchPromise = (supabase as any)
        .from('currencies')
        .insert({
          code: currency.code || '',
          name: currency.name || '',
          exchange_rate: currency.exchangeRate || 1,
          symbol: currency.symbol || '',
        })
        .select()
        .single();

      const { data, error } = await withTimeout(fetchPromise, 5000);

      if (error) {
        const errorMsg = error.message || 'فشل إنشاء العملة';
        console.error('❌ Error creating currency:', error);
        throw new Error(errorMsg);
      }

      clearCache('currencies_all');
      return transformCurrency(data);
    } catch (e: any) {
      const errorMessage = e?.message || 'خطأ غير متوقع عند إنشاء العملة';
      console.error('❌ Exception creating currency:', errorMessage);
      throw new Error(errorMessage);
    }
  },

  async update(id: string, updates: Partial<Currency>): Promise<Currency | null> {
    try {
      const fetchPromise = (supabase as any)
        .from('currencies')
        .update({
          code: updates.code,
          name: updates.name,
          exchange_rate: updates.exchangeRate,
          symbol: updates.symbol,
        })
        .eq('id', id)
        .select()
        .single();

      const { data, error } = await withTimeout(fetchPromise, 5000);

      if (error) {
        const errorMsg = error.message || 'فشل تحديث العملة';
        console.error('❌ Error updating currency:', error);
        throw new Error(errorMsg);
      }

      clearCache('currencies_all');
      return transformCurrency(data);
    } catch (e: any) {
      const errorMessage = e?.message || 'خطأ غير متوقع عند تحديث العملة';
      console.error('❌ Exception updating currency:', errorMessage);
      throw new Error(errorMessage);
    }
  },

  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      return false;
    }

    try {
      const fetchPromise = (supabase as any)
        .from('currencies')
        .delete()
        .eq('id', id);

      const { error } = await withTimeout(fetchPromise, 5000);

      if (error) {
        const errorMsg = error.message || 'فشل حذف العملة';
        console.error('❌ Error deleting currency:', error);
        throw new Error(errorMsg);
      }

      clearCache('currencies_all');
      return true;
    } catch (e: any) {
      const errorMessage = e?.message || 'خطأ غير متوقع عند حذف العملة';
      console.error('❌ Exception deleting currency:', errorMessage);
      throw new Error(errorMessage);
    }
  },
};
