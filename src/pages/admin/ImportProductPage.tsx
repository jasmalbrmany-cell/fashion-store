import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Link as LinkIcon, Loader, Check, AlertCircle,
  X, Plus, Zap, Globe, Info, Sparkles, CheckCircle2,
  ImageIcon, Tag, ShoppingBag, Layers
} from 'lucide-react';
import { categoriesService } from '@/services/api';
import { mockCategories } from '@/data/mockData';
import { productsService } from '@/services';
import { Category } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/components/Common/Toast';

interface ImportedProduct {
  name: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  sizes: { name: string }[];
  colors: { name: string; hex: string }[];
  sourceUrl: string;
  strategy?: string;
}

const StrategyBadge: React.FC<{ strategy?: string }> = ({ strategy }) => {
  const map: Record<string, { label: string; color: string }> = {
    firecrawl:  { label: 'Firecrawl AI', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    jina:       { label: 'Jina Reader', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    'html-proxy': { label: 'HTML Parser', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    manual:     { label: 'خطأ - يدوي', color: 'bg-red-100 text-red-700 border-red-200' },
  };
  const info = strategy ? map[strategy] : null;
  if (!info) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${info.color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {info.label}
    </span>
  );
};

const ImportProductPage: React.FC = () => {
  const navigate = useNavigate();
  const { isRTL, t } = useLanguage();
  const { toast } = useToast();

  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [importedProduct, setImportedProduct] = useState<ImportedProduct | null>(null);
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [inlineError, setInlineError] = useState('');

  useEffect(() => {
    categoriesService.getAll().then(data => {
      if (data && data.length > 0) setCategories(data);
    });
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    images: [] as { id: string; url: string; isPrimary: boolean }[],
    sizes: [] as { id: string; name: string; stock: number; priceModifier: number }[],
    colors: [] as { id: string; name: string; hex: string; stock: number }[],
    isVisible: false,
  });

  const handleFetchProduct = async () => {
    if (!url.trim()) {
      setInlineError(isRTL ? 'يرجى إدخال رابط منتج' : 'Please enter a product URL');
      return;
    }

    const urlLower = url.toLowerCase();
    const isHomePage = (
      (urlLower.match(/zahraah\.com\/(ar|en)\/?$/) || urlLower.match(/shein\.com\/(ar)?\/?$/)) &&
      !urlLower.includes('/products/') && !urlLower.includes('/product/') &&
      !urlLower.includes('/p-') && !urlLower.includes('/item/')
    );
    if (isHomePage) {
      setInlineError(isRTL
        ? 'أدخلت رابط الصفحة الرئيسية. يرجى الانتقال لصفحة منتج محدد ونسخ رابطه.'
        : 'You entered the store home page. Please navigate to a specific product page.');
      return;
    }

    setIsLoading(true);
    setInlineError('');

    try {
      const apiRes = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const apiResult = await apiRes.json();
      const scraped = apiResult.data;
      const strategy = apiResult.strategy || 'manual';

      if (!scraped) throw new Error('No data returned');

      const scrapedSizes = scraped.sizes && scraped.sizes.length > 0
        ? scraped.sizes.map((s: any) => typeof s === 'string' ? { name: s } : s)
        : [{ name: 'S' }, { name: 'M' }, { name: 'L' }, { name: 'XL' }];

      const scrapedColors = scraped.colors && scraped.colors.length > 0
        ? scraped.colors
        : [{ name: isRTL ? 'أسود' : 'Black', hex: '#1F2937' }];

      const uniqueImages: string[] = [...new Set((scraped.images || []) as string[])].filter(Boolean) as string[];

      const productInfo: ImportedProduct = {
        name:        scraped.title || '',
        description: scraped.description || '',
        price:       scraped.price || 0,
        currency:    scraped.currency || 'YER',
        images:      uniqueImages,
        sizes:       scrapedSizes,
        colors:      scrapedColors,
        sourceUrl:   url,
        strategy,
      };

      setImportedProduct(productInfo);

      // --- SMART AI-LIKE MATCHING ALGORITHM ---
      const findBestCategory = () => {
        const title = productInfo.name.toLowerCase() + ' ' + productInfo.description.toLowerCase();
        
        // 1. Check direct suggestions from API
        if (apiResult.suggestedCategory) {
          const matched = categories.find(c =>
            c.name.toLowerCase().includes(apiResult.suggestedCategory.toLowerCase()) || 
            apiResult.suggestedCategory.toLowerCase().includes(c.name.toLowerCase())
          );
          if (matched) return matched.id;
        }

        // 2. Keyword matching map (extends easily)
        const keywordMap: Record<string, string[]> = {
          'أطفال': ['طفل', 'baby', 'kid', 'child', 'بناتي', 'ولادي', 'أطفال'],
          'رجالي': ['رجالي', 'men', 'man', 'male', 'قميص رجالي'],
          'نسائي': ['نسائي', 'women', 'lady', 'female', 'فستان', 'حقيبة نسائية'],
          'أحذية': ['حذاء', 'shoes', 'sneaker', 'بوت', 'نعال', 'جزمة'],
          'عطور': ['عطر', 'perfume', 'fragrance', 'بخاخ'],
          'إكسسوارات': ['ساعة', 'نظارة', 'خاتم', 'قلادة', 'accessories', 'watch'],
        };

        // Try to find a category whose name or synonyms match keywords in title
        for (const cat of categories) {
           const catName = cat.name.toLowerCase();
           // Check if category name itself is in title
           if (title.includes(catName)) return cat.id;

           // Check keywords for common category types
           for (const [key, keywords] of Object.entries(keywordMap)) {
              if (catName.includes(key) && keywords.some(k => title.includes(k))) {
                 return cat.id;
              }
           }
        }
        
        // 3. Simple URL fallback
        if (url.includes('pletino.com')) {
          const kidscat = categories.find(c => c.name.includes('أطفال'));
          if (kidscat) return kidscat.id;
        }

        return '';
      };

      const autoCategoryId = findBestCategory();

      setFormData({
        name:        productInfo.name,
        description: productInfo.description,
        price:       productInfo.price > 0 ? productInfo.price.toString() : '',
        categoryId:  autoCategoryId,
        images:      uniqueImages.map((img, i) => ({ id: `img-${Date.now()}-${i}`, url: img, isPrimary: i === 0 })),
        sizes:       scrapedSizes.map((s: any, i: number) => ({ id: `size-${i}`, name: typeof s === 'string' ? s : s.name, stock: 10, priceModifier: 0 })),
        colors:      scrapedColors.map((c: any, i: number) => ({ id: `color-${i}`, name: c.name, hex: c.hex || '#1F2937', stock: 10 })),
        isVisible:   false,
      });

      const hasTitle  = !!productInfo.name;
      const hasImages = uniqueImages.length > 0;

      if (strategy === 'firecrawl' && hasTitle && hasImages) {
        toast.success(
          isRTL ? '✅ Firecrawl نجح!' : '✅ Firecrawl Success!',
          isRTL ? `استُخلصت البيانات كاملة: ${uniqueImages.length} صورة، ${scrapedSizes.length} مقاس` : `Full data extracted: ${uniqueImages.length} images, ${scrapedSizes.length} sizes`
        );
      } else if (hasTitle || hasImages) {
        toast.success(
          isRTL ? '⚡ تم الاستخراج الجزئي' : '⚡ Partial Extraction',
          isRTL ? 'راجع البيانات وأكمل الحقول الناقصة يدوياً.' : 'Review the data and complete any missing fields manually.'
        );
      } else {
        setInlineError(isRTL
          ? 'الموقع محمي بقوة. تُفتح نموذج الإضافة اليدوية — أكمل البيانات بنفسك.'
          : 'Site is heavily protected. Manual form opened — complete the data yourself.');
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setImportedProduct({ name: '', description: '', price: 0, currency: 'YER', images: [], sizes: [], colors: [], sourceUrl: url, strategy: 'manual' });
      setInlineError(isRTL
        ? 'حدث خطأ أثناء جلب البيانات. تُفتح نموذج الإضافة اليدوية.'
        : 'Error fetching data. Manual entry form opened.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId) {
      toast.error(isRTL ? 'القسم مطلوب' : 'Category required', isRTL ? 'يرجى اختيار قسم المنتج أولاً' : 'Please select a product category first.');
      return;
    }
    if (!formData.name.trim()) {
      toast.error(isRTL ? 'الاسم مطلوب' : 'Name required', isRTL ? 'يرجى إدخال اسم المنتج' : 'Please enter the product name.');
      return;
    }

    setIsSaving(true);
    try {
      const result = await productsService.create({
        ...formData,
        price:     parseFloat(formData.price) || 0,
        sourceUrl: url,
        stock:     formData.sizes.reduce((acc, s) => acc + s.stock, 0) || 10,
      });
      if (result) {
        toast.success(
          isRTL ? '🎉 تم النشر بنجاح!' : '🎉 Published!',
          isRTL ? 'تم حفظ المنتج ونشره في المتجر.' : 'Product saved and published to your store.'
        );
        setTimeout(() => navigate('/admin/products'), 1200);
      } else {
        toast.error(isRTL ? 'فشل الحفظ' : 'Save Failed', isRTL ? 'تعذر حفظ المنتج، حاول مجدداً.' : 'Product could not be saved. Please try again.');
      }
    } catch (err: any) {
      toast.error(isRTL ? 'خطأ في الاتصال' : 'Connection Error', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-12" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Link to="/admin/products" className="w-12 h-12 flex items-center justify-center bg-gray-50 border border-gray-100 rounded-2xl hover:bg-black hover:text-white transition-all">
            <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">
              {isRTL ? 'الاستيراد الذكي' : 'Smart Import'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase">
                {isRTL ? 'Firecrawl AI + 2 Fallbacks' : 'Firecrawl AI + 2 Fallbacks'}
              </span>
            </div>
          </div>
        </div>
        {/* Strategy legend */}
        <div className="hidden md:flex items-center gap-2">
          <StrategyBadge strategy="firecrawl" />
          <StrategyBadge strategy="jina" />
          <StrategyBadge strategy="html-proxy" />
        </div>
      </div>

      {/* Hero Input Card */}
      <div className="bg-gray-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-10 opacity-10">
          <Zap className="w-40 h-40 text-white fill-white" />
        </div>

        <div className="relative z-10 max-w-4xl space-y-8">
          <div className="space-y-3">
            <h2 className="text-3xl font-black tracking-tighter">
              {isRTL ? 'حوّل أي منتج إلى متجرك في ثوانٍ' : 'Transform any product in seconds'}
            </h2>
            <p className="text-white/40 font-bold max-w-xl">
              {isRTL
                ? 'يستخدم النظام Firecrawl AI للاستخراج الذكي، مع احتياطيين إضافيين لضمان النجاح دائماً.'
                : 'Uses Firecrawl AI for intelligent extraction with 2 automatic fallbacks for maximum success rate.'}
            </p>
            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 pt-1">
              {['Firecrawl AI', 'Jina Reader', 'HTML Parser', isRTL ? 'إضافة يدوية' : 'Manual Fallback'].map(f => (
                <span key={f} className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black text-white/60 uppercase tracking-wider">
                  {f}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 p-2 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-xl">
            <div className="flex-1 relative">
              <input
                type="url"
                value={url}
                onChange={e => { setUrl(e.target.value); setInlineError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleFetchProduct()}
                placeholder={isRTL ? 'https://pletino.com/product/... أو أي رابط منتج' : 'https://example.com/product/...'}
                className="w-full pl-12 pr-6 py-5 bg-transparent rounded-3xl outline-none font-bold text-white placeholder:text-white/20"
              />
              <Globe className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
            </div>
            <button
              onClick={handleFetchProduct}
              disabled={isLoading}
              className="px-12 py-5 bg-white text-black rounded-[1.5rem] font-black hover:bg-amber-400 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl whitespace-nowrap disabled:opacity-60"
            >
              {isLoading
                ? <><Loader className="w-5 h-5 animate-spin" />{isRTL ? 'جارٍ الاستخراج...' : 'Extracting...'}</>
                : <><Sparkles className="w-5 h-5" />{isRTL ? 'استيراد الآن' : 'Import Now'}</>
              }
            </button>
          </div>

          {/* Progress indicator while loading */}
          {isLoading && (
            <div className="space-y-3 animate-in fade-in duration-500">
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
              <p className="text-white/40 text-xs font-bold">
                {isRTL ? '⚡ Firecrawl يستخرج البيانات الكاملة...' : '⚡ Firecrawl extracting full data...'}
              </p>
            </div>
          )}

          {/* Inline error */}
          {inlineError && (
            <div className="flex items-start gap-4 p-6 bg-red-500/10 border border-red-500/20 rounded-[2rem] text-red-200 animate-in zoom-in-95 duration-300">
              <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
              <p className="font-bold text-sm">{inlineError}</p>
            </div>
          )}
        </div>
      </div>

      {/* Supported Sites */}
      {!importedProduct && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Pletino', flag: '🇸🇦', desc: isRTL ? 'ملابس أطفال' : 'Kids Fashion' },
            { name: 'Zahraah', flag: '🇾🇪', desc: isRTL ? 'أزياء يمنية' : 'Yemeni Fashion' },
            { name: 'SHEIN', flag: '🌍', desc: isRTL ? 'أزياء عالمية' : 'Global Fashion' },
            { name: isRTL ? 'أي موقع' : 'Any Site', flag: '✨', desc: isRTL ? 'استخراج تلقائي' : 'Auto-extract' },
          ].map(site => (
            <div key={site.name} className="bg-white rounded-2xl p-5 border border-gray-100 text-center shadow-sm hover:border-gray-300 hover:shadow-md transition-all">
              <span className="text-3xl">{site.flag}</span>
              <p className="font-black text-gray-900 mt-2">{site.name}</p>
              <p className="text-xs text-gray-400 font-bold mt-0.5">{site.desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* Product Editor Form */}
      {importedProduct && (
        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">

          {/* Status bar */}
          <div className="bg-white rounded-2xl px-6 py-4 border border-gray-100 flex flex-wrap items-center gap-3 shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <span className="font-black text-gray-900 text-sm">{isRTL ? 'تم الاستخراج — راجع وعدّل البيانات' : 'Extracted — review & edit below'}</span>
            <StrategyBadge strategy={importedProduct.strategy} />
            <div className="flex gap-3 ms-auto text-xs font-bold text-gray-400">
              <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3" />{formData.images.length} {isRTL ? 'صورة' : 'imgs'}</span>
              <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{formData.sizes.length} {isRTL ? 'مقاس' : 'sizes'}</span>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 md:p-12">
            <div className="flex items-center gap-3 mb-10 pb-6 border-b border-gray-50">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tighter">
                  {isRTL ? 'تخصيص بيانات المنتج' : 'Customize Product Data'}
                </h2>
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">
                  {isRTL ? 'عدّل البيانات النهائية قبل النشر' : 'Edit final details before publishing'}
                </p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
              {/* Left: Text Fields */}
              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{isRTL ? 'اسم المنتج *' : 'Product Name *'}</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-8 py-5 bg-gray-50 border border-transparent focus:border-black focus:bg-white rounded-[1.5rem] transition-all outline-none font-black text-xl"
                    placeholder={isRTL ? 'اسم المنتج...' : 'Product name...'}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{isRTL ? 'الوصف التسويقي' : 'Marketing Description'}</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                    rows={5}
                    className="w-full px-8 py-5 bg-gray-50 border border-transparent focus:border-black focus:bg-white rounded-[1.5rem] transition-all outline-none font-bold text-gray-600 leading-relaxed resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{isRTL ? 'سعر البيع *' : 'Sale Price *'}</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.price}
                        onChange={e => setFormData(p => ({ ...p, price: e.target.value }))}
                        className="w-full px-8 py-5 bg-black text-white rounded-[1.5rem] font-black text-2xl tracking-tighter outline-none"
                        required
                      />
                      <span className="absolute right-6 top-1/2 -translate-y-1/2 text-white/30 font-black text-xs">{t.rial}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{isRTL ? 'القسم *' : 'Category *'}</label>
                    <select
                      value={formData.categoryId}
                      onChange={e => setFormData(p => ({ ...p, categoryId: e.target.value }))}
                      className="w-full px-8 py-5 bg-gray-50 border border-transparent focus:border-black hover:bg-gray-100 rounded-[1.5rem] font-black appearance-none cursor-pointer outline-none h-full"
                      required
                    >
                      <option value="">{isRTL ? 'اختر القسم' : 'Select'}</option>
                      {categories.filter(c => !c.parentId).map(parent => (
                        <React.Fragment key={parent.id}>
                          <option value={parent.id} className="font-black bg-gray-100">
                            📁 {parent.name}
                          </option>
                          {categories.filter(c => c.parentId === parent.id).map(child => (
                            <option key={child.id} value={child.id} className="font-bold">
                              &nbsp;&nbsp;&nbsp;&nbsp;↳ {child.name}
                            </option>
                          ))}
                        </React.Fragment>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Sizes preview */}
                {formData.sizes.length > 0 && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{isRTL ? 'المقاسات المستخرجة' : 'Extracted Sizes'}</label>
                    <div className="flex flex-wrap gap-2">
                      {formData.sizes.map(s => (
                        <span key={s.id} className="px-4 py-2 bg-gray-100 rounded-full font-black text-sm text-gray-700">{s.name}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Colors preview */}
                {formData.colors.length > 0 && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{isRTL ? 'الألوان المستخرجة' : 'Extracted Colors'}</label>
                    <div className="flex flex-wrap gap-3">
                      {formData.colors.map(c => (
                        <div key={c.id} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100">
                          <span className="w-5 h-5 rounded-full border border-gray-200 flex-shrink-0" style={{ backgroundColor: c.hex }} />
                          <span className="text-xs font-bold text-gray-700">{c.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Images + Publish */}
              <div className="space-y-8">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 block">
                    {isRTL ? `معرض الصور (${formData.images.length})` : `Image Gallery (${formData.images.length})`}
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {formData.images.map((img, idx) => (
                      <div key={img.id} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-transparent hover:border-black transition-all group">
                        <img src={img.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" onError={e => (e.currentTarget.style.display = 'none')} />
                        {idx === 0 && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 bg-black text-white text-[8px] font-black rounded-full uppercase">
                            {isRTL ? 'رئيسية' : 'Main'}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, images: p.images.filter((_, i) => i !== idx) }))}
                          className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const imgUrl = prompt(isRTL ? 'رابط الصورة:' : 'Image URL:');
                        if (imgUrl) setFormData(p => ({ ...p, images: [...p.images, { id: `img-${Date.now()}`, url: imgUrl, isPrimary: p.images.length === 0 }] }));
                      }}
                      className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl hover:border-black hover:bg-gray-50 transition-all text-gray-400 hover:text-black gap-2"
                    >
                      <Plus className="w-6 h-6" />
                      <span className="text-[8px] font-black uppercase tracking-widest">{isRTL ? 'إضافة' : 'Add'}</span>
                    </button>
                  </div>
                </div>

                {/* Visibility toggle */}
                <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                  <label className="flex items-center gap-4 cursor-pointer">
                    <div
                      className={`relative w-14 h-7 rounded-full transition-all duration-300 ${formData.isVisible ? 'bg-emerald-500' : 'bg-gray-300'}`}
                      onClick={() => setFormData(p => ({ ...p, isVisible: !p.isVisible }))}
                    >
                      <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${formData.isVisible ? 'right-1' : 'left-1'}`} />
                    </div>
                    <div>
                      <p className="font-black text-gray-900 text-sm">{isRTL ? 'نشر فور الحفظ' : 'Publish immediately'}</p>
                      <p className="text-xs text-gray-400 font-bold">{isRTL ? 'إذا كان مُفعّلاً سيظهر في المتجر مباشرة' : 'If enabled, visible in store right away'}</p>
                    </div>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-5 bg-black text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-800 disabled:opacity-60 shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  {isSaving
                    ? <><Loader className="w-5 h-5 animate-spin" />{isRTL ? 'جارٍ النشر...' : 'Publishing...'}</>
                    : <><Check className="w-5 h-5" />{isRTL ? 'نشر المنتج الآن' : 'Publish Product'}</>
                  }
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default ImportProductPage;
