import React, { useState, useEffect } from 'react';
import { Plus, Search, Check, X, AlertCircle, Edit2, Trash2, Globe, Settings2, Trash } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { scrapingRulesService, ScrapingRule } from '@/services/api';
import { useToast } from '@/components/Common/Toast';

export default function ScrapingRulesPage() {
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  
  const [rules, setRules] = useState<ScrapingRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Partial<ScrapingRule> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setIsLoading(true);
    const data = await scrapingRulesService.getAll();
    setRules(data);
    setIsLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule?.domain) return;
    
    setIsSaving(true);
    try {
      if (editingRule.id) {
        await scrapingRulesService.update(editingRule.id, editingRule);
        toast.success(isRTL ? 'تم التحديث بنجاح' : 'Updated successfully');
      } else {
        await scrapingRulesService.create(editingRule as Omit<ScrapingRule, 'id'>);
        toast.success(isRTL ? 'تمت الإضافة بنجاح' : 'Added successfully');
      }
      setIsModalOpen(false);
      setEditingRule(null);
      loadRules();
    } catch {
      toast.error(isRTL ? 'حدث خطأ أثناء الحفظ' : 'Error saving rule');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(isRTL ? 'هل أنت متأكد من الحذف؟' : 'Are you sure?')) return;
    const ok = await scrapingRulesService.delete(id);
    if (ok) {
      toast.success(isRTL ? 'تم الحذف' : 'Deleted');
      loadRules();
    } else {
      toast.error(isRTL ? 'فشل الحذف' : 'Delete failed');
    }
  };

  const filteredRules = rules.filter(r => r.domain.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Settings2 className="w-6 h-6 text-indigo-600" />
            {isRTL ? 'ربط المواقع (API Mappings)' : 'Scraping Rules'}
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">
            {isRTL ? 'إعداد أكواد القراءة الدقيقة للمواقع المستوردة' : 'Configure dynamic scraping DOM selectors'}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingRule({ domain: '', active: true });
            setIsModalOpen(true);
          }}
          className="bg-black text-white px-6 py-2.5 rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center gap-2 text-sm shadow-lg shadow-black/20"
        >
          <Plus className="w-5 h-5" />
          {isRTL ? 'إضافة موقع' : 'Add Domain'}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5`} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={isRTL ? 'ابحث باسم النطاق (مثال: zara.com)' : 'Search domain...'}
          className={`w-full ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all`}
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-black border-t-transparent rounded-full mx-auto" />
        </div>
      ) : filteredRules.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
          <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-bold">{isRTL ? 'لا توجد قواعد مسجلة' : 'No rules found'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRules.map(rule => (
            <div key={rule.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm relative group hover:border-black transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${rule.active ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <h3 className="font-bold text-lg text-gray-900">{rule.domain}</h3>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingRule(rule); setIsModalOpen(true); }} className="text-gray-400 hover:text-black">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => rule.id && handleDelete(rule.id)} className="text-gray-400 hover:text-red-500">
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl font-mono text-xs overflow-hidden">
                <p><span className="text-gray-400 font-sans">{isRTL ? 'الاسم:' : 'Name:'}</span> {rule.name_selector || '*'}</p>
                <p><span className="text-gray-400 font-sans">{isRTL ? 'السعر:' : 'Price:'}</span> {rule.price_selector || '*'}</p>
                <p><span className="text-gray-400 font-sans">{isRTL ? 'الصورة المميزة:' : 'Image:'}</span> {rule.image_selector || '*'}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && editingRule && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-black text-gray-900">
                {editingRule.id ? (isRTL ? 'تعديل قاعدة الاستيراد' : 'Edit Rule') : (isRTL ? 'إضافة قاعدة استيراد' : 'Add Rule')}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">{isRTL ? 'النطاق (Domain)' : 'Domain'}</label>
                <input
                  type="text"
                  required
                  value={editingRule.domain || ''}
                  onChange={e => setEditingRule({...editingRule, domain: e.target.value.toLowerCase().trim()})}
                  placeholder="مثال: zara.com"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-black font-mono text-sm"
                />
              </div>

              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex gap-3 text-indigo-800 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="font-semibold">
                  {isRTL 
                    ? 'أدخل الـ CSS Selectors الخاصة بالبيانات. اترك الحقل فارغاً إذا كنت تريد للنظام أن يحاول الاستخراج التلقائي.' 
                    : 'Enter CSS Selectors for data extraction. Leave empty for auto extraction.'}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {[
                  { key: 'name_selector', label: isRTL ? 'محدد اسم المنتج' : 'Name Selector', ph: 'h1.product-name' },
                  { key: 'price_selector', label: isRTL ? 'محدد السعر' : 'Price Selector', ph: '.price-current' },
                  { key: 'image_selector', label: isRTL ? 'محدد الصورة الأساسية' : 'Image Selector', ph: 'img.main-image' },
                  { key: 'description_selector', label: isRTL ? 'محدد الوصف' : 'Description Selector', ph: 'div.product-description' },
                  { key: 'sizes_selector', label: isRTL ? 'محدد المقاسات' : 'Sizes Selector', ph: 'button.size-variant' },
                ].map(field => (
                  <div key={field.key}>
                    <label className="block text-sm font-bold text-gray-700 mb-1">{field.label}</label>
                    <input
                      type="text"
                      value={(editingRule as any)[field.key] || ''}
                      onChange={e => setEditingRule({...editingRule, [field.key]: e.target.value})}
                      placeholder={field.ph}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-black font-mono text-sm"
                    />
                  </div>
                ))}
              </div>

              <label className="flex items-center gap-3 cursor-pointer p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition">
                <input
                  type="checkbox"
                  checked={editingRule.active !== false}
                  onChange={e => setEditingRule({...editingRule, active: e.target.checked})}
                  className="w-5 h-5 accent-green-600 rounded"
                />
                <span className="font-bold text-sm text-gray-900">{isRTL ? 'قاعدة مفعّلة' : 'Active Rule'}</span>
              </label>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-4 bg-black text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-gray-800 transition-all disabled:opacity-50 mt-4"
              >
                {isSaving ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (isRTL ? 'حفظ البيانات' : 'Save Rule')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
