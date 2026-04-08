import React, { useState } from 'react';
import { Save, Building2, Globe, Bell, Palette, Mail, Phone, Link as LinkIcon } from 'lucide-react';
import { mockStoreSettings } from '@/data/mockData';

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState(mockStoreSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const updateSocialLink = (field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [field]: value,
      },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إعدادات المتجر</h1>
          <p className="text-gray-500">إدارة إعدادات المتجر ووسائل التواصل</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Store Info */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">معلومات المتجر</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">اسم المتجر</label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">العملة الأساسية</label>
              <select
                value={settings.currency}
                onChange={(e) => setSettings(prev => ({ ...prev, currency: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="YER">ريال يمني (ر.ي)</option>
                <option value="SAR">ريال سعودي (ر.س)</option>
                <option value="USD">دولار أمريكي ($)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <LinkIcon className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">روابط التواصل</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* WhatsApp */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 text-green-600" />
                رقم الواتساب العام
              </label>
              <input
                type="tel"
                value={settings.socialLinks.whatsapp}
                onChange={(e) => updateSocialLink('whatsapp', e.target.value)}
                placeholder="967777123456"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                dir="ltr"
              />
              <p className="text-xs text-gray-500 mt-1">بدون + أو 00 في البداية</p>
            </div>

            {/* Facebook */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Globe className="w-4 h-4 text-blue-600" />
                رابط فيسبوك
              </label>
              <input
                type="url"
                value={settings.socialLinks.facebook || ''}
                onChange={(e) => updateSocialLink('facebook', e.target.value)}
                placeholder="https://facebook.com/..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            {/* Instagram */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Palette className="w-4 h-4 text-pink-600" />
                رابط إنستجرام
              </label>
              <input
                type="url"
                value={settings.socialLinks.instagram || ''}
                onChange={(e) => updateSocialLink('instagram', e.target.value)}
                placeholder="https://instagram.com/..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            {/* TikTok */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <LinkIcon className="w-4 h-4 text-gray-800" />
                رابط تيك توك
              </label>
              <input
                type="url"
                value={settings.socialLinks.tiktok || ''}
                onChange={(e) => updateSocialLink('tiktok', e.target.value)}
                placeholder="https://tiktok.com/@..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            {/* Email */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 text-blue-600" />
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={settings.socialLinks.email || ''}
                onChange={(e) => updateSocialLink('email', e.target.value)}
                placeholder="info@fashionhub.com"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                dir="ltr"
              />
            </div>
          </div>
        </div>

        {/* WhatsApp Categories */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">أرقام الواتساب للأقسام</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ملابس نسائية</label>
              <input
                type="tel"
                value={settings.socialLinks.whatsappCategory?.['cat-1'] || ''}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  socialLinks: {
                    ...prev.socialLinks,
                    whatsappCategory: {
                      ...prev.socialLinks.whatsappCategory,
                      'cat-1': e.target.value,
                    },
                  },
                }))}
                placeholder="967777111111"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ملابس رجالية</label>
              <input
                type="tel"
                value={settings.socialLinks.whatsappCategory?.['cat-2'] || ''}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  socialLinks: {
                    ...prev.socialLinks,
                    whatsappCategory: {
                      ...prev.socialLinks.whatsappCategory,
                      'cat-2': e.target.value,
                    },
                  },
                }))}
                placeholder="967777222222"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                dir="ltr"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-4">
          {saved && (
            <span className="text-green-600 text-sm">تم الحفظ بنجاح!</span>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {isSaving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
