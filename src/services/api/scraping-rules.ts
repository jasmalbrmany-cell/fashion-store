import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { ScrapingRule } from './types';

export const scrapingRulesService = {
  async getAll(): Promise<ScrapingRule[]> {
    if (!isSupabaseConfigured()) return [];
    try {
      const { data, error } = await (supabase as any)
        .from('store_scraping_rules')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('Error fetching rules:', e);
      return [];
    }
  },

  async getByDomain(domain: string): Promise<ScrapingRule | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data, error } = await (supabase as any)
        .from('store_scraping_rules')
        .select('*')
        .eq('domain', domain)
        .eq('active', true)
        .single();
      if (error) return null;
      return data;
    } catch {
      return null;
    }
  },

  async create(rule: Omit<ScrapingRule, 'id'>): Promise<ScrapingRule | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const { data, error } = await (supabase as any)
        .from('store_scraping_rules')
        .insert([rule])
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('Error creating rule:', e);
      return null;
    }
  },

  async update(id: string, updates: Partial<ScrapingRule>): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const { error } = await (supabase as any)
        .from('store_scraping_rules')
        .update(updates)
        .eq('id', id);
      return !error;
    } catch (e) {
      console.error('Error updating rule:', e);
      return false;
    }
  },

  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const { error } = await (supabase as any)
        .from('store_scraping_rules')
        .delete()
        .eq('id', id);
      return !error;
    } catch (e) {
      console.error('Error deleting rule:', e);
      return false;
    }
  }
};
