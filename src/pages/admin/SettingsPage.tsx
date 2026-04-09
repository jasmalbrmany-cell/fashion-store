import React, { useState, useEffect } from 'react';
import { Save, Building2, Globe, Palette, Mail, Phone, Link as LinkIcon, CheckCircle2, Loader2, Share2, Instagram, Facebook } from 'lucide-react';
import { storeSettingsService, categoriesService } from '@/services/api';
import { StoreSettings, Category, City } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { hasValidCache, getCachedSync } from '@/services/api';

const SettingsPage: React.FC = () => {
  const { isRTL, t } = useLanguage();
  const [settings, setSettings] = useState<StoreSettings | null>(getCachedSync<StoreSettings>('settings_main'));
  const [categories, setCategories] = useState<Category[]>(getCachedSync<Category[]>('categories_all') || []);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(!hasValidCache('settings_main'));

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [settingsData, categoriesData] = await Promise.all([
          storeSettingsService.get(),
          categoriesService.getAll()
        ]);
        setSettings(settingsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Failed to load settings data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    
    setIsSaving(true);
    
    // Emergency unblock timeout
    const safetyTimeout = setTimeout(() => {
        setIsSaving(false);
        setSaved(false);
    }, 10000);

    try {
      const result = await storeSettingsService.update(settings);
      if (result) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      clearTimeout(safetyTimeout);
      setIsSaving(false);
    }
  };

  const updateSocialLink = (field: string, value: string) => {
    if (!settings) return;
    setSettings(prev => prev ? ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [field]: value,
      },
    }) : null);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-black" />
        <p className="font-bold text-gray-400 animate-pulse">{t.loading}</p>
      </div>
    );
  }

  // Use imported mockStoreSettings as fallback if settings is still null for some reason
  // We need to import it or define a local fallback
  const finalSettings = settings || {
    name: 'Fashion Hub',
    logo: '',
    currency: 'YER',
    socialLinks: { whatsapp: '', email: '' }
  } as StoreSettings;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">{t.identitySettings}</h1>
          <p className="text-gray-500 font-bold">{t.identitySettingsDesc}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center justify-center gap-2 px-8 py-4 bg-black text-white rounded-2xl font-black hover:bg-gray-800 transition shadow-xl shadow-gray-200 disabled:opacity-50 min-w-[160px]"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {isSaving ? t.saving : t.saveChanges}
        </button>
      </div>

      <form onSubmit={handleSave} className="grid gap-8">
        {/* Store Brand */}
        <div className="bg-white rounded-3xl shadow-sm border p-6 md:p-8 space-y-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
             <Building2 className="w-32 h-32" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-900 text-white rounded-xl flex items-center justify-center shadow-lg shadow-gray-200">
              <Building2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-gray-900">{t.branding}</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 relative z-10">
            <div className="space-y-3">
              <label className="block text-xs font-black uppercase tracking-widest text-gray-400 px-2">{t.officialStoreName}</label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => setSettings(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black focus:bg-white transition-all outline-none font-bold"
              />
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-black uppercase tracking-widest text-gray-400 px-2">{t.logoUrl}</label>
              <input
                type="text"
                value={settings.logo}
                onChange={(e) => setSettings(prev => prev ? ({ ...prev, logo: e.target.value }) : null)}
                placeholder="https://..."
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black focus:bg-white transition-all outline-none font-medium"
                dir="ltr"
              />
            </div>
          </div>
        </div>

        {/* Global Connections */}
        <div className="bg-white rounded-3xl shadow-sm border p-6 md:p-8 space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
              <Share2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-gray-900">{t.socialChannels}</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* WhatsApp */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 px-2">
                <Phone className="w-4 h-4 text-green-500" />
                {t.mainWhatsapp}
              </label>
              <div className="flex items-center bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-black transition-all">
                <div className="bg-gray-100 px-4 py-4 border-r border-gray-200 font-black text-gray-400 flex items-center justify-center min-w-[70px]">
                  +967
                </div>
                <input
                  type="tel"
                  value={settings.socialLinks.whatsapp.replace(/^967/, '')}
                  onChange={(e) => updateSocialLink('whatsapp', '967' + e.target.value.replace(/[^0-9]/g, '').substring(0, 9))}
                  placeholder="77XXXXXXX"
                  className="w-full px-6 py-4 bg-transparent transition-all outline-none font-black"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Instagram */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 px-2">
                <Instagram className="w-4 h-4 text-pink-500" />
                Instagram
              </label>
              <input
                type="url"
                value={settings.socialLinks.instagram || ''}
                onChange={(e) => updateSocialLink('instagram', e.target.value)}
                placeholder="https://instagram.com/..."
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black focus:bg-white transition-all outline-none font-medium"
                dir="ltr"
              />
            </div>

            {/* Facebook */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 px-2">
                <Facebook className="w-4 h-4 text-blue-600" />
                Facebook
              </label>
              <input
                type="url"
                value={settings.socialLinks.facebook || ''}
                onChange={(e) => updateSocialLink('facebook', e.target.value)}
                placeholder="https://facebook.com/..."
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black focus:bg-white transition-all outline-none font-medium"
                dir="ltr"
              />
            </div>

            {/* TikTok */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 px-2">
                <Share2 className="w-4 h-4 text-black" />
                {t.tiktok}
              </label>
              <input
                type="url"
                value={settings.socialLinks.tiktok || ''}
                onChange={(e) => updateSocialLink('tiktok', e.target.value)}
                placeholder="https://tiktok.com/@..."
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black focus:bg-white transition-all outline-none font-medium"
                dir="ltr"
              />
            </div>

            {/* Email */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 px-2">
                <Mail className="w-4 h-4 text-orange-500" />
                {t.officialEmail}
              </label>
              <input
                type="email"
                value={settings.socialLinks.email || ''}
                onChange={(e) => updateSocialLink('email', e.target.value)}
                placeholder="info@yourstore.com"
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black focus:bg-white transition-all outline-none font-medium"
                dir="ltr"
              />
            </div>
          </div>
        </div>

        {/* WhatsApp Routers */}
        <div className="bg-white rounded-3xl shadow-sm border p-6 md:p-8 space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-50 text-green-600 border border-green-100 rounded-xl flex items-center justify-center">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">{t.categoryRouting}</h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{t.categoryRoutingDesc}</p>
            </div>
          </div>

          <div className="grid gap-4">
            {categories.map((cat) => (
              <div key={cat.id} className="flex flex-col md:flex-row md:items-center gap-4 p-6 bg-gray-50 rounded-[2rem] border border-gray-100 transition-all hover:bg-white hover:shadow-md group">
                <div className="min-w-[150px] flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-black group-hover:scale-150 transition-transform"></div>
                  <span className="font-black text-gray-900 text-lg">
                    {cat.name}
                  </span>
                </div>
                <div className="flex-1 flex items-center bg-white border border-gray-100 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-black shadow-sm transition-all">
                  <div className="bg-gray-50 px-4 py-3 border-r border-gray-100 font-black text-gray-400 text-sm">
                    +967
                  </div>
                  <input
                    type="tel"
                    value={(settings.socialLinks.whatsappCategory?.[cat.id as keyof typeof settings.socialLinks.whatsappCategory] || '').replace(/^967/, '')}
                    onChange={(e) => {
                      const val = '967' + e.target.value.replace(/[^0-9]/g, '').substring(0, 9);
                      setSettings(prev => {
                        if (!prev) return null;
                        const catMap = { ...(prev.socialLinks.whatsappCategory || {}) };
                        catMap[cat.id as keyof typeof catMap] = val;
                        return {
                          ...prev,
                          socialLinks: {
                            ...prev.socialLinks,
                            whatsappCategory: catMap
                          }
                        };
                      });
                    }}
                    placeholder="77XXXXXXX"
                    className="w-full px-6 py-3 bg-transparent outline-none font-black"
                    dir="ltr"
                  />
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <div className="py-12 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                <p className="text-gray-400 font-black">{t.noCategories}</p>
              </div>
            )}
          </div>
        </div>

        {/* Floating Success Indicator */}
        {saved && (
          <div className={`fixed bottom-10 ${isRTL ? 'left-10' : 'right-10'} flex items-center gap-3 bg-black text-white px-8 py-5 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-10 z-50 border border-white/10`}>
            <div className="p-1 bg-green-500 rounded-full">
                <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-black uppercase tracking-widest text-sm">{t.savedSuccessfully}</span>
          </div>
        )}
      </form>
    </div>
  );
};

export default SettingsPage;
