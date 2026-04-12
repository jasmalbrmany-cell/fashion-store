import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { productsService, categoriesService } from '@/services';
import { uploadImagesToSupabase } from '@/lib/imageUpload';
import { Loader2, Link as LinkIcon, Sparkles, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface ImportedData {
  title: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  sizes: string[];
  colors: { name: string; hex: string }[];
  sourceUrl: string;
  suggestedCategory?: string;
}

interface ImportResult {
  success: boolean;
  strategy: 'firecrawl' | 'jina' | 'proxy' | 'failed';
  data?: ImportedData;
  error?: string;
  attempts: {
    firecrawl: boolean;
    jina: boolean;
    proxy: boolean;
  };
}

export default function UnifiedImportPage() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [formData, setFormData] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState<string>('');

  React.useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const cats = await categoriesService.getAll();
    setCategories(cats);
  };

  const handleImport = async () => {
    if (!url.trim()) return;

    setLoading(true);
    setImportResult(null);
    setFormData(null);
    setProgress('🔄 جاري الاتصال بالموقع...');

    try {
      const response = await fetch('/api/unified-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const result: ImportResult = await response.json();
      setImportResult(result);

      if (result.success && result.data) {
        // Initialize form data
        setFormData({
          name: result.data.title,
          description: result.data.description,
          price: result.data.price,
          categoryId: findCategoryByName(result.data.suggestedCategory || ''),
          images: result.data.images.map((url, idx) => ({
            id: `img-${idx}`,
            url,
            isPrimary: idx === 0,
          })),
          sizes: result.data.sizes.map((name, idx) => ({
            id: `size-${idx}`,
            name,
            stock: 10,
            priceModifier: 0,
          })),
          colors: result.data.colors.map((color, idx) => ({
            id: `color-${idx}`,
            ...color,
            stock: 10,
          })),
          stock: 100,
          isVisible: true,
          sourceUrl: result.data.sourceUrl,
        });
        setProgress('✅ تم جلب البيانات بنجاح!');
      } else {
        setProgress('❌ فشل الاستيراد من جميع المصادر');
      }
    } catch (error: any) {
      setImportResult({
        success: false,
        strategy: 'failed',
        error: error.message,
        attempts: { firecrawl: false, jina: false, proxy: false },
      });
      setProgress('❌ حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  const findCategoryByName = (name: string): string => {
    if (!name) return categories[0]?.id || '';
    const found = categories.find(c => c.name.includes(name) || name.includes(c.name));
    return found?.id || categories[0]?.id || '';
  };

  const handleSave = async () => {
    if (!formData) return;

    setSaving(true);
    setProgress('📤 جاري رفع الصور إلى السيرفر...');

    try {
      // Upload images to Supabase Storage
      const productId = `product-${Date.now()}`;
      const uploadedImageUrls = await uploadImagesToSupabase(
        formData.images.map((img: any) => img.url),
        productId
      );

      setProgress('💾 جاري حفظ المنتج...');

      // Update image URLs
      const updatedImages = formData.images.map((img: any, idx: number) => ({
        ...img,
        url: uploadedImageUrls[idx],
      }));

      // Save product
      await productsService.create({
        ...formData,
        images: updatedImages,
      });

      setProgress('✅ تم حفظ المنتج بنجاح!');
      
      setTimeout(() => {
        navigate('/admin/products');
      }, 1500);
    } catch (error: any) {
      setProgress('❌ فشل حفظ المنتج: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const getStrategyIcon = (strategy: string) => {
    switch (strategy) {
      case 'firecrawl': return '🔥';
      case 'jina': return '🤖';
      case 'proxy': return '🌐';
      default: return '❌';
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {language === 'ar' ? '🚀 استيراد منتج ذكي' : '🚀 Smart Product Import'}
        </h1>
        <p className="text-gray-600">
          {language === 'ar' 
            ? 'الصق رابط أي منتج وسنقوم باستيراده تلقائياً مع جميع التفاصيل'
            : 'Paste any product URL and we\'ll import it automatically with all details'}
        </p>
      </div>

      {/* URL Input */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <label className="block text-sm font-medium mb-2">
          {language === 'ar' ? 'رابط المنتج' : 'Product URL'}
        </label>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/product/..."
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={loading || saving}
            />
          </div>
          <button
            onClick={handleImport}
            disabled={loading || saving || !url.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {language === 'ar' ? 'جاري الاستيراد...' : 'Importing...'}
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                {language === 'ar' ? 'استيراد' : 'Import'}
              </>
            )}
          </button>
        </div>

        {/* Progress */}
        {progress && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            {progress}
          </div>
        )}
      </div>

      {/* Import Result Status */}
      {importResult && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="font-semibold mb-4">
            {language === 'ar' ? 'نتيجة الاستيراد' : 'Import Result'}
          </h3>
          
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getStrategyIcon(importResult.strategy)}</span>
              <div>
                <div className="font-medium">
                  {importResult.success ? (
                    <span className="text-green-600">✅ نجح الاستيراد</span>
                  ) : (
                    <span className="text-red-600">❌ فشل الاستيراد</span>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  الطريقة المستخدمة: {importResult.strategy}
                </div>
              </div>
            </div>

            {/* Attempts */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium mb-2">المحاولات:</div>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  {importResult.attempts.firecrawl ? <CheckCircle2 className="w-4 h-4 text-blue-500" /> : <XCircle className="w-4 h-4 text-gray-300" />}
                  <span>Firecrawl API</span>
                </div>
                <div className="flex items-center gap-2">
                  {importResult.attempts.jina ? <CheckCircle2 className="w-4 h-4 text-blue-500" /> : <XCircle className="w-4 h-4 text-gray-300" />}
                  <span>Jina.ai Reader</span>
                </div>
                <div className="flex items-center gap-2">
                  {importResult.attempts.proxy ? <CheckCircle2 className="w-4 h-4 text-blue-500" /> : <XCircle className="w-4 h-4 text-gray-300" />}
                  <span>CORS Proxies</span>
                </div>
              </div>
            </div>

            {importResult.error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                {importResult.error}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview & Edit Form */}
      {formData && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="font-semibold mb-4 text-lg">
            {language === 'ar' ? '📝 معاينة وتعديل المنتج' : '📝 Preview & Edit Product'}
          </h3>

          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {language === 'ar' ? 'اسم المنتج' : 'Product Name'}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {language === 'ar' ? 'الوصف' : 'Description'}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            {/* Price & Category */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === 'ar' ? 'السعر' : 'Price'}
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === 'ar' ? 'الفئة' : 'Category'}
                  {importResult?.data?.suggestedCategory && (
                    <span className="text-xs text-green-600 mr-2">
                      (مقترح: {importResult.data.suggestedCategory})
                    </span>
                  )}
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Images Preview */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {language === 'ar' ? 'الصور' : 'Images'} ({formData.images.length})
              </label>
              <div className="grid grid-cols-4 gap-3">
                {formData.images.map((img: any, idx: number) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border">
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                    {img.isPrimary && (
                      <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                        رئيسية
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {language === 'ar' ? 'جاري الحفظ...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    {language === 'ar' ? 'حفظ المنتج' : 'Save Product'}
                  </>
                )}
              </button>
              <button
                onClick={() => navigate('/admin/products')}
                disabled={saving}
                className="px-6 py-3 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
