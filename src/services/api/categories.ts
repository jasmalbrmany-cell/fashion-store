import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Category } from '@/types';
import { withTimeout, clearCache, transformCategory } from './helpers';

export const categoriesService = {
  async getAll(): Promise<Category[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    try {
      const { data, error } = await withTimeout((supabase as any)
        .from('categories')
        .select('*')
        .order('order', { ascending: true }));

      if (error) {
        console.error('Error fetching categories:', error);
        return [];
      }

      const transformed = (data || []).map(transformCategory);
      return transformed;
    } catch (e) {
      console.error('Exception fetching categories:', e);
      return [];
    }
  },

  async getById(id: string): Promise<Category | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    const { data, error } = await (supabase as any)
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching category:', error);
      return null;
    }

    return transformCategory(data);
  },

  async create(category: Partial<Category>): Promise<Category | null> {
    try {
      const fetchPromise = (supabase as any)
        .from('categories')
        .insert({
          name: category.name || '',
          icon: category.icon,
          parent_id: category.parentId || null,
          order: category.order || 0,
        })
        .select()
        .single();

      const { data, error } = await withTimeout(fetchPromise, 8000);

      if (error) {
        const errorMsg = error.message || 'فشل إنشاء القسم';
        console.error('❌ Error creating category:', error);
        throw new Error(errorMsg);
      }

      clearCache('categories_all');
      return transformCategory(data);
    } catch (e: any) {
      const errorMessage = e?.message || 'خطأ غير متوقع عند إنشاء القسم';
      console.error('❌ Exception creating category:', errorMessage);
      throw new Error(errorMessage);
    }
  },

  async update(id: string, updates: Partial<Category>): Promise<Category | null> {
    try {
      const fetchPromise = (supabase as any)
        .from('categories')
        .update({
          name: updates.name,
          icon: updates.icon,
          parent_id: updates.parentId !== undefined ? (updates.parentId || null) : undefined,
          order: updates.order,
        })
        .eq('id', id)
        .select()
        .single();

      const { data, error } = await withTimeout(fetchPromise, 8000);

      if (error) {
        const errorMsg = error.message || 'فشل تحديث القسم';
        console.error('❌ Error updating category:', error);
        throw new Error(errorMsg);
      }

      clearCache('categories_all');
      return transformCategory(data);
    } catch (e: any) {
      const errorMessage = e?.message || 'خطأ غير متوقع عند تحديث القسم';
      console.error('❌ Exception updating category:', errorMessage);
      throw new Error(errorMessage);
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const fetchPromise = (supabase as any)
        .from('categories')
        .delete()
        .eq('id', id);

      const { error } = await withTimeout(fetchPromise, 8000);

      if (error) {
        const errorMsg = error.message || 'فشل حذف القسم';
        console.error('❌ Error deleting category:', error);
        throw new Error(errorMsg);
      }

      clearCache('categories_all');
      return true;
    } catch (e: any) {
      const errorMessage = e?.message || 'خطأ غير متوقع عند حذف القسم';
      console.error('❌ Exception deleting category:', errorMessage);
      throw new Error(errorMessage);
    }
  },
};
