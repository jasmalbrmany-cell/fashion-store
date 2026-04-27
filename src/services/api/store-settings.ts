import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { StoreSettings } from '@/types';
import { withTimeout, getFromCache, setToCache, clearCache } from './helpers';

const SETTINGS_ID = '00000000-0000-0000-0000-000000000000';

const defaultSettings: StoreSettings = {
  id: SETTINGS_ID,
  name: 'Fashion Hub',
  logo: '',
  currency: 'SAR',
  socialLinks: { whatsapp: '' },
  isMaintenanceMode: false,
};

export const storeSettingsService = {
  async get(): Promise<StoreSettings | null> {
    const cached = getFromCache('settings_main');
    if (cached) return cached;

    if (!isSupabaseConfigured()) {
      return defaultSettings;
    }

    const fetchPromise = (supabase as any)
      .from('store_settings')
      .select('*')
      .eq('id', SETTINGS_ID)
      .single();

    try {
      const { data, error } = await withTimeout(fetchPromise, 10000);

      if (error || !data) {
        console.warn('Settings not found in DB, using default');
        return defaultSettings;
      }

      const transformed: StoreSettings = {
        id: data.id,
        name: data.name || defaultSettings.name,
        logo: data.logo || defaultSettings.logo,
        currency: data.currency || defaultSettings.currency,
        socialLinks: data.social_links || defaultSettings.socialLinks,
        isMaintenanceMode: data.is_maintenance_mode ?? false,
      };
      
      setToCache('settings_main', transformed);
      return transformed;
    } catch (e) {
      return defaultSettings;
    }
  },

  async update(settings: Partial<StoreSettings>): Promise<StoreSettings | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    const updates = {
      id: SETTINGS_ID,
      name: settings.name,
      logo: settings.logo,
      currency: settings.currency,
      social_links: settings.socialLinks,
      is_maintenance_mode: settings.isMaintenanceMode,
      updated_at: new Date().toISOString()
    };

    try {
      const fetchPromise = (supabase as any)
        .from('store_settings')
        .upsert(updates)
        .select()
        .single();

      const { data, error } = await withTimeout(fetchPromise, 8000);
      
      if (error || !data) {
        const errorMsg = error?.message || 'فشل تحديث إعدادات المتجر';
        console.error('❌ Error updating store settings:', error);
        throw new Error(errorMsg);
      }
      
      const transformed: StoreSettings = {
        id: data.id,
        name: data.name,
        logo: data.logo || '',
        currency: data.currency,
        socialLinks: data.social_links || { whatsapp: '' },
        isMaintenanceMode: data.is_maintenance_mode ?? false,
      };
      
      clearCache('settings_main');
      setToCache('settings_main', transformed);
      return transformed;
    } catch (e: any) {
      const errorMessage = e?.message || 'خطأ غير متوقع عند تحديث الإعدادات - تحقق من الاتصال';
      console.error('❌ Exception updating settings:', errorMessage);
      throw new Error(errorMessage);
    }
  },
};
