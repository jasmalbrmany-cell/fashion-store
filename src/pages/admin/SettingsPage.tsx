import React, { useState, useEffect } from 'react';
import { Save, Building2, Globe, Palette, Mail, Phone, Link as LinkIcon, CheckCircle2, Loader2, Share2, Instagram, Facebook } from 'lucide-react';
import { storeSettingsService, categoriesService } from '@/services/api';
import { StoreSettings, Category, City } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { hasValidCache, getCachedSync } from '@/services/api';
import { useToast } from '@/components/Common/Toast';

const SettingsPage: React.FC = () => {
  const { isRTL, t } = useLanguage();
  const { toast } = useToast();
  const [settings, setSettings] = useState<StoreSettings | null>(getCachedSync<StoreSettings>('settings_main'));
  const [categories, setCategories] = useState<Category[]>(getCachedSync<Category[]>('categories_all') || []);
  const [isSaving, setIsSaving] = useState(false);
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
    }, 10000);

    try {
      const result = await storeSettingsService.update(settings);
      if (result) {
        toast.success(
          isRTL ? '✅ تم حفظ الإعدادات' : '✅ Settings Saved',
          isRTL ? 'تم حفظ جميع إعدادات المتجر بنجاح في قاعدة البيانات' : 'All store settings saved to database successfully.'
        );
      } else {
        toast.error(
          isRTL ? '❌ فشل الحفظ' : '❌ Save Failed',
          isRTL ? 'لم يتم حفظ الإعدادات، حاول مرة أخرى' : 'Settings could not be saved. Please try again.'
        );
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      toast.error(
        isRTL ? '❌ خطأ في الاتصال' : '❌ Connection Error',
        isRTL ? 'تعذر الاتصال بقاعدة البيانات' : 'Could not connect to the database.'
      );
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
        
      {/* Maintenance Mode Alert */}
      <div className={`p-6 md:p-8 rounded-[2rem] border-2 transition-all ${
        finalSettings.isMaintenanceMode 
          ? 'bg-orange-50 border-orange-200 shadow-lg shadow-orange-100' 
          : 'bg-green-50 border-green-100'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
              finalSettings.isMaintenanceMode ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'
            }`}>
              {finalSettings.isMaintenanceMode ? <Loader2 className="w-7 h-7 animate-spin" /> : <CheckCircle2 className="w-7 h-7" />}
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900">
                {isRTL ? 'وضع التحديث المباشر' : 'Live Update Mode'}
              </h3>
              <p className="text-sm text-gray-500 font-bold mt-1 leading-relaxed">
                {isRTL 
                  ? 'عند تفعيل هذا الوضع، سيظهر للعملاء شاشة "جاري التحميل" ولن يتمكنوا من رؤية المنتجات غير المكتملة أثناء قيامك بالإضافات.'
                  : 'When enabled, customers will see a "Loading" screen and won\'t see incomplete products while you are making additions.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white/50 p-2 rounded-2xl border border-white">
            <span className={`text-xs font-black uppercase tracking-widest ${finalSettings.isMaintenanceMode ? 'text-orange-600' : 'text-green-600'}`}>
              {finalSettings.isMaintenanceMode ? (isRTL ? 'نشط' : 'ACTIVE') : (isRTL ? 'متوقف' : 'INACTIVE')}
            </span>
            <button
               type="button"
               onClick={() => setSettings(prev => prev ? { ...prev, isMaintenanceMode: !prev.isMaintenanceMode } : null)}
               className={`relative w-16 h-8 rounded-full transition-colors duration-300 focus:outline-none ${
                 finalSettings.isMaintenanceMode ? 'bg-orange-500' : 'bg-gray-200'
               }`}
            >
               <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transform transition-transform duration-300 ${
                 isRTL 
                   ? (finalSettings.isMaintenanceMode ? '-translate-x-1' : '-translate-x-9')
                   : (finalSettings.isMaintenanceMode ? 'translate-x-9' : 'translate-x-1')
               }`}></div>
            </button>
          </div>
        </div>
      </div>

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
                value={finalSettings.name}
                onChange={(e) => setSettings(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black focus:bg-white transition-all outline-none font-bold"
              />
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-black uppercase tracking-widest text-gray-400 px-2">{t.logoUrl}</label>
              <input
                type="text"
                value={finalSettings.logo}
                onChange={(e) => setSettings(prev => prev ? ({ ...prev, logo: e.target.value }) : null)}
                placeholder="https://..."
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black focus:bg-white transition-all outline-none font-medium"
                dir="ltr"
              />
            </div>
          </div>
        </div>

        {/* Site Content (Top Bar & Footer) */}
        <div className="bg-white rounded-3xl shadow-sm border p-6 md:p-8 space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-amber-100">
              <Palette className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-gray-900">{isRTL ? 'نصوص الموقع والتنبيهات' : 'Site Content & Announcements'}</h2>
          </div>

          <div className="grid gap-8">
            {/* Top Bar Marquee */}
            <div className="space-y-3">
              <label className="block text-xs font-black uppercase tracking-widest text-gray-400 px-2">
                {isRTL ? 'نص شريط التنبيهات العلوي (المتحرك)' : 'Top Bar Announcement (Marquee)'}
              </label>
              <textarea
                value={finalSettings.socialLinks?.topBarText || ''}
                onChange={(e) => updateSocialLink('topBarText', e.target.value)}
                placeholder={isRTL ? 'مثال: التوصيل مجاني للطلبات فوق 500 ريال | خصم 10% بمناسبة الافتتاح' : 'Example: Free shipping on orders over 500 SAR | 10% off for opening'}
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black focus:bg-white transition-all outline-none font-bold resize-none h-24"
              />
              <p className="text-[10px] text-gray-400 font-bold px-2 italic">
                {isRTL ? '* سيظهر هذا النص بشكل متحرك في أعلى المتجر.' : '* This text will scroll at the very top of the store.'}
              </p>
            </div>

            {/* Footer Description */}
            <div className="space-y-3">
              <label className="block text-xs font-black uppercase tracking-widest text-gray-400 px-2">
                {isRTL ? 'وصف المتجر في الأسفل (Footer)' : 'Footer Description'}
              </label>
              <textarea
                value={finalSettings.socialLinks?.footerText || ''}
                onChange={(e) => updateSocialLink('footerText', e.target.value)}
                placeholder={isRTL ? 'اكتب نبذة قصيرة عن متجرك تظهر في أسفل كل صفحة...' : 'Write a short bio about your store that appears at the bottom of every page...'}
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black focus:bg-white transition-all outline-none font-medium resize-none h-32"
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
                  value={(finalSettings.socialLinks?.whatsapp || '').replace(/^967/, '')}
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
                value={finalSettings.socialLinks?.instagram || ''}
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
                value={finalSettings.socialLinks?.facebook || ''}
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
                value={finalSettings.socialLinks?.tiktok || ''}
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
                value={finalSettings.socialLinks?.email || ''}
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
                    value={(finalSettings.socialLinks?.whatsappCategory?.[cat.id as keyof typeof finalSettings.socialLinks.whatsappCategory] || '').replace(/^967/, '')}
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

        {/* Floating success: now handled by global Toast system */}
      </form>
    </div>
  );
};

export default SettingsPage;
