import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Product } from '@/types';
import { 
  withTimeout, getFromCache, setToCache, clearCache, transformProduct, transformProductToDb 
} from './helpers';

export const productsService = {
  async getAll(): Promise<Product[]> {
    const cached = getFromCache('products_all');
    if (cached) return cached;

    if (!isSupabaseConfigured()) {
      return [];
    }

    const fetchPromise = (supabase as any)
      .from('products')
      .select('*')
      .eq('is_visible', true)
      .order('created_at', { ascending: false });

    try {
      const { data, error } = await withTimeout(fetchPromise);

      if (error) {
        console.error('Error fetching products:', error);
        return [];
      }

      const transformed = (data || []).map(transformProduct);
      setToCache('products_all', transformed);
      return transformed;
    } catch (e) {
      return [];
    }
  },

  async getByCategory(categoryId: string): Promise<Product[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    const fetchPromise = (supabase as any)
      .from('products')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_visible', true)
      .order('created_at', { ascending: false });

    try {
      const { data, error } = await withTimeout(fetchPromise);

      if (error) {
        console.error('Error fetching products by category:', error);
        return [];
      }

      return (data || []).map(transformProduct);
    } catch (e) {
      return [];
    }
  },

  async getById(id: string): Promise<Product | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    const { data, error } = await (supabase as any)
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      return null;
    }

    return transformProduct(data);
  },

  async search(query: string): Promise<Product[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    // Normalize query for Arabic: replace all forms of Alef with plain Alef
    const normalizedQuery = query.replace(/[أإآ]/g, 'ا');

    const { data, error } = await (supabase as any)
      .from('products')
      .select('*')
      .eq('is_visible', true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,name.ilike.%${normalizedQuery}%,description.ilike.%${normalizedQuery}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching products:', error);
      return [];
    }

    return (data || []).map(transformProduct);
  },

  async getAllAdmin(): Promise<Product[]> {
    const cached = getFromCache('products_admin_all');
    if (cached) return cached;

    if (!isSupabaseConfigured()) {
      return [];
    }

    const fetchPromise = (supabase as any)
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    try {
      const { data, error } = await withTimeout(fetchPromise);

      if (error) {
        console.error('Error fetching admin products:', error);
        return [];
      }

      const transformed = (data || []).map(transformProduct);
      setToCache('products_admin_all', transformed);
      return transformed;
    } catch (e) {
      console.error('Exception fetching admin products:', e);
      return [];
    }
  },

  async create(product: Partial<Product>): Promise<Product | null> {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured, cannot create product');
      return null;
    }
    try {
      const fetchPromise = (supabase as any)
        .from('products')
        .insert(transformProductToDb(product))
        .select()
        .single();

      const { data, error } = await withTimeout(fetchPromise);

      if (error) {
        const errorMsg = error.message || 'فشل إنشاء المنتج';
        console.error('❌ Error creating product:', error);
        throw new Error(errorMsg);
      }

      clearCache('products_all');
      clearCache('products_admin_all');
      return transformProduct(data);
    } catch (e: any) {
      const errorMessage = e?.message || 'خطأ غير متوقع عند إنشاء المنتج - تحقق من الاتصال';
      console.error('❌ Exception creating product:', errorMessage);
      throw new Error(errorMessage);
    }
  },

  async update(id: string, updates: Partial<Product>): Promise<Product | null> {
    if (!isSupabaseConfigured()) return null;
    try {
      const fetchPromise = (supabase as any)
        .from('products')
        .update(transformProductToDb(updates))
        .eq('id', id)
        .select()
        .single();

      const { data, error } = await withTimeout(fetchPromise);

      if (error) {
        const errorMsg = error.message || 'فشل تحديث المنتج';
        console.error('❌ Error updating product:', error);
        throw new Error(errorMsg);
      }

      clearCache('products_all');
      clearCache('products_admin_all');
      return transformProduct(data);
    } catch (e: any) {
      const errorMessage = e?.message || 'خطأ غير متوقع عند تحديث المنتج - تحقق من الاتصال';
      console.error('❌ Exception updating product:', errorMessage);
      throw new Error(errorMessage);
    }
  },

  async delete(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      return false;
    }

    try {
      const fetchPromise = (supabase as any)
        .from('products')
        .delete()
        .eq('id', id);

      const { error } = await withTimeout(fetchPromise);

      if (error) {
        const errorMsg = error.message || 'فشل حذف المنتج';
        console.error('❌ Error deleting product:', error);
        throw new Error(errorMsg);
      }

      clearCache('products_all');
      clearCache('products_admin_all');
      return true;
    } catch (e: any) {
      const errorMessage = e?.message || 'خطأ غير متوقع عند حذف المنتج';
      console.error('❌ Exception deleting product:', errorMessage);
      throw new Error(errorMessage);
    }
  },

  async toggleVisibility(id: string): Promise<Product | null> {
    const product = await this.getById(id);
    if (!product) return null;
    return this.update(id, { isVisible: !product.isVisible });
  },
};
