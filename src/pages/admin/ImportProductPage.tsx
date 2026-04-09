import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Link as LinkIcon,
  Loader,
  Check,
  AlertCircle,
  Image as ImageIcon,
  X,
  Plus,
  Zap,
  Globe,
  Info,
  Sparkles,
  Search
} from 'lucide-react';
import { mockCategories } from '@/data/mockData';
import { productsService } from '@/services';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useLanguage } from '@/context/LanguageContext';

interface ImportedProduct {
  name: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  sizes: { name: string }[];
  colors: { name: string; hex: string }[];
  sourceUrl: string;
}

const ImportProductPage: React.FC = () => {
  const navigate = useNavigate();
  const { isRTL, t } = useLanguage();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [importedProduct, setImportedProduct] = useState<ImportedProduct | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    images: [] as { id: string; url: string; isPrimary: boolean }[],
    sizes: [] as { id: string; name: string; stock: number; priceModifier: number }[],
    colors: [] as { id: string; name: string; hex: string; stock: number }[],
    isVisible: true,
  });

  const handleFetchProduct = async () => {
    if (!url.trim()) {
      setError(isRTL ? 'يرجى إدخال رابط منتج محدد' : 'Please enter a specific product URL');
      return;
    }

    const urlLower = url.toLowerCase();
    
    // Improved detection for Home Pages vs Product Pages
    const isHomePage = (
      (urlLower.match(/zahraah\.com\/(ar|en)\/?$/) || urlLower.match(/shein\.com\/(ar)?\/?$/)) &&
      !urlLower.includes('/products/') && !urlLower.includes('/product/') && !urlLower.includes('/p-') && !urlLower.includes('/item/')
    );
    
    if (isHomePage) {
      setError(isRTL 
        ? 'عذراً! لقد أدخلت رابط الصفحة الرئيسية للمتجر. لجلب البيانات، يجب عليك الدخول لصفحة "منتج معين" ونسخ الرابط الخاص به من الأعلى.' 
        : 'Oops! You entered the store home page. To fetch data, you must go to a specific "product page" and copy its link from the address bar.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Strategy 1: Use our Vercel API route (supports SPA rendering)
      let scraped: any = null;
      
      try {
        const apiRes = await fetch('/api/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
        const apiResult = await apiRes.json();
        if (apiResult.data) {
          scraped = apiResult.data;
          // API returns sizes and colors arrays directly
        }
      } catch (apiErr) {
        console.warn('API route failed, trying client-side fallback...', apiErr);
      }

      // Strategy 2: Client-side CORS proxy fallback
      if (!scraped || (!scraped.title && (!scraped.images || scraped.images.length === 0))) {
        try {
          const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
          const proxyRes = await fetch(proxyUrl, { signal: AbortSignal.timeout(12000) });
          const html = await proxyRes.text();
          
          // Parse JSON-LD
          const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
          if (jsonLdMatch) {
            try {
              const jsonData = JSON.parse(jsonLdMatch[1]);
              const product = Array.isArray(jsonData) ? jsonData.find((d: any) => d['@type'] === 'Product') : (jsonData['@type'] === 'Product' ? jsonData : null);
              if (product) {
                scraped = {
                  ...scraped,
                  title: product.name || scraped?.title || '',
                  description: product.description || scraped?.description || '',
                  price: parseFloat(product.offers?.price || product.offers?.lowPrice || '0') || scraped?.price || 0,
                  images: [...(scraped?.images || []), ...(Array.isArray(product.image) ? product.image : product.image ? [product.image] : [])],
                  currency: product.offers?.priceCurrency || 'YER',
                };
              }
            } catch (e) {}
          }

          // Extract additional images from HTML
          if (!scraped?.images?.length) {
            const imgMatches = html.matchAll(/(?:data-src|src)=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/gi);
            const foundImgs: string[] = [];
            for (const m of imgMatches) {
              if (!m[1].includes('icon') && !m[1].includes('logo') && !m[1].includes('favicon') && foundImgs.length < 8) {
                foundImgs.push(m[1]);
              }
            }
            if (foundImgs.length) {
              scraped = { ...scraped, images: [...(scraped?.images || []), ...foundImgs] };
            }
          }
        } catch (proxyErr) {
          console.warn('Client-side proxy also failed', proxyErr);
        }
      }

      // If still no data, show empty form for manual entry
      if (!scraped) {
        scraped = { 
          title: '', 
          description: isRTL 
            ? 'نقدم لك هذا المنتج المتميز بتصميمه العصري الذي يواكب أحدث صيحات الموضة. تم تصنيع هذا المنتج بعناية فائقة باستخدام خامات عالية الجودة لضمان الراحة والاستدامة. إضافة مثالية لإطلالتك اليومية أو في المناسبات الخاصة، مصمم ليمنحك مظهراً جذاباً وفريداً من نوعه.'
            : 'Introducing this premium product with a modern design that keeps up with the latest fashion trends. Carefully crafted using high-quality materials to ensure comfort and sustainability. A perfect addition to your daily look or special occasions, designed to give you an attractive and unique appearance.', 
          price: 0, 
          images: [], 
          sizes: [], 
          colors: [], 
          currency: 'YER' 
        };
      } else if (!scraped.description) {
        scraped.description = isRTL 
          ? 'نقدم لك هذا المنتج المتميز بتصميمه العصري الذي يواكب أحدث صيحات الموضة. تم تصنيع هذا المنتج بعناية فائقة باستخدام خامات عالية الجودة لضمان الراحة والاستدامة. إضافة مثالية لإطلالتك اليومية أو في المناسبات الخاصة، مصمم ليمنحك مظهراً جذاباً وفريداً من نوعه.'
          : 'Introducing this premium product with a modern design that keeps up with the latest fashion trends. Carefully crafted using high-quality materials to ensure comfort and sustainability. A perfect addition to your daily look or special occasions, designed to give you an attractive and unique appearance.';
      }

      // Use sizes from scraper or defaults
      const scrapedSizes = scraped.sizes && scraped.sizes.length > 0 
        ? scraped.sizes.map((s: any) => typeof s === 'string' ? { name: s } : s)
        : [{ name: 'S' }, { name: 'M' }, { name: 'L' }, { name: 'XL' }];

      // Use colors from scraper or defaults  
      const scrapedColors = scraped.colors && scraped.colors.length > 0
        ? scraped.colors
        : [{ name: isRTL ? 'أسود' : 'Black', hex: '#1F2937' }];

      // Deduplicate images
      const uniqueImages: string[] = [...new Set((scraped.images || []) as string[])].filter(Boolean) as string[];

      const productInfo: ImportedProduct = {
        name: scraped.title || '',
        description: scraped.description || '',
        price: scraped.price || 0,
        currency: scraped.currency || 'YER',
        images: uniqueImages,
        sizes: scrapedSizes,
        colors: scrapedColors,
        sourceUrl: url,
      };

      setImportedProduct(productInfo);
      setFormData({
        name: productInfo.name,
        description: productInfo.description,
        price: productInfo.price > 0 ? productInfo.price.toString() : '',
        categoryId: '',
        images: uniqueImages.map((img: string, i: number) => ({
          id: `img-${Date.now()}-${i}`,
          url: img,
          isPrimary: i === 0
        })),
        sizes: scrapedSizes.map((s: any, i: number) => ({
          id: `size-${i}`,
          name: typeof s === 'string' ? s : s.name,
          stock: 10,
          priceModifier: 0,
        })),
        colors: scrapedColors.map((c: any, i: number) => ({
          id: `color-${i}`,
          name: c.name,
          hex: c.hex || '#1F2937',
          stock: 10,
        })),
        isVisible: true,
      });
      
      // Show appropriate message
      const hasImages = uniqueImages.length > 0;
      const hasTitle = !!productInfo.name;
      
      if (hasTitle && hasImages) {
        setSuccess(isRTL ? 'رائع! تم استخلاص بيانات المنتج بالكامل. راجع البيانات وأكمل الحفظ.' : 'Great! Full product data extracted. Review and save.');
      } else if (hasImages || scrapedSizes.length > 4) {
        setSuccess(isRTL 
          ? 'تم استخلاص الصور والمقاسات بنجاح! أكمل الاسم والسعر يدوياً ثم احفظ.' 
          : 'Images and sizes extracted! Complete the name and price manually, then save.');
      } else {
        setError(isRTL 
          ? 'هذا الموقع يستخدم حماية قوية. تم فتح نموذج الإضافة اليدوية - أدخل البيانات بنفسك.' 
          : 'This site uses strong protection. Manual form opened - enter the data yourself.');
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setImportedProduct({
        name: '', description: '', price: 0, currency: 'YER', images: [], sizes: [], colors: [], sourceUrl: url
      });
      setError(isRTL 
        ? 'حدث خطأ أثناء جلب البيانات. تم فتح نموذج الإضافة اليدوية لتتمكن من إكمال الإضافة بسهولة.' 
        : 'Error fetching data. Manual entry form opened for you to complete easily.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId) {
      setError(isRTL ? 'يرجى اختيار القسم أولاً' : 'Please select a category first');
      return;
    }

    setIsSaving(true);
    const result = await productsService.create({
      ...formData,
      price: parseFloat(formData.price),
      sourceUrl: url,
      stock: formData.sizes.reduce((acc, s) => acc + s.stock, 0) || 10
    });
    setIsSaving(false);

    if (result) {
      alert(isRTL ? 'تم الحفظ بنجاح!' : 'Saved successfully!');
      navigate('/admin/products');
    }
  };

  return (
    <div className="space-y-8 pb-12" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Premium Header */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
            <Link to="/admin/products" className="w-12 h-12 flex items-center justify-center bg-gray-50 border border-gray-100 rounded-2xl hover:bg-black hover:text-white transition-all">
                <ArrowLeft className={`w-5 h-5 ${isRTL ? '' : 'rotate-180'}`} />
            </Link>
            <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">{isRTL ? 'الاستيراد العابر للحدود' : 'Cross-Border Import'}</h1>
                <div className="flex items-center gap-2 mt-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-gray-400 tracking-widest uppercase">{isRTL ? 'الذكاء الاصطناعي نشط' : 'Scraper engine active'}</span>
                </div>
            </div>
        </div>
      </div>

      {/* Main Input Card */}
      <div className="bg-gray-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-10 opacity-10">
            <Zap className="w-40 h-40 text-white fill-white" />
        </div>
        
        <div className="relative z-10 max-w-4xl space-y-8">
            <div className="space-y-2">
                <h2 className="text-3xl font-black tracking-tighter">{isRTL ? 'حول أي منتج إلى متجرك في ثوانٍ' : 'Transform any product in seconds'}</h2>
                <p className="text-white/40 font-bold max-w-xl">{isRTL ? 'يدعم المتصفح الذكي سحب البيانات من المتاجر العالمية الكبيرة، في حال الحظر يمكنك الإكمال يدوياً.' : 'The smart scraper supports fetching from major global stores. If blocked, you can complete manually.'}</p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 p-2 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-xl">
                <div className="flex-1 relative">
                    <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://ar.shein.com/product/..."
                        className="w-full pl-12 pr-6 py-5 bg-transparent rounded-3xl transition-all outline-none font-bold text-white placeholder:text-white/20"
                    />
                    <Globe className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                </div>
                <button
                    onClick={handleFetchProduct}
                    disabled={isLoading}
                    className="px-14 py-5 bg-white text-black rounded-[1.5rem] font-black hover:bg-amber-400 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl whitespace-nowrap"
                >
                    {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-black" />}
                    {isRTL ? 'استيراد الآن' : 'Import Now'}
                </button>
            </div>

            {error && (
                <div className="flex items-start gap-4 p-6 bg-red-500/10 border border-red-500/20 rounded-[2rem] text-red-200 animate-in zoom-in-95 duration-300">
                    <AlertCircle className="w-6 h-6 flex-shrink-0" />
                    <div className="space-y-1">
                        <p className="font-black text-sm">{error}</p>
                        {url.includes('shein') && !url.includes('/product/') && (
                             <p className="text-xs font-bold text-red-300 italic">{isRTL ? 'تنبيه: لقد استخدمت رابط المتجر العام، يرجى اختيار منتج معين.' : 'Note: You used the general store link, please select a specific product.'}</p>
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Product Form Editor */}
      {importedProduct && (
        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 md:p-12">
                <div className="flex items-center gap-3 mb-10 pb-6 border-b border-gray-50">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                        <Info className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tighter">{isRTL ? 'تخصيص بيانات المنتج المستورد' : 'Tailor Imported Specifications'}</h2>
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{isRTL ? 'تعديل البيانات النهائية قبل العرض' : 'Edit final details before display'}</p>
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-12">
                    <div className="space-y-8">
                        <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{isRTL ? 'اسم المنتج في متجرك' : 'Product Brand Name'}</label>
                             <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                                className="w-full px-8 py-5 bg-gray-50 border border-transparent focus:border-black focus:bg-white rounded-[1.5rem] transition-all outline-none font-black text-xl"
                                placeholder={isRTL ? 'عنوان المنتج هنا...' : 'Product title here...'}
                                required
                             />
                        </div>

                        <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{isRTL ? 'الوصف التسويقي' : 'Marketing Description'}</label>
                             <textarea
                                value={formData.description}
                                onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                                rows={6}
                                className="w-full px-8 py-5 bg-gray-50 border border-transparent focus:border-black focus:bg-white rounded-[1.5rem] transition-all outline-none font-bold text-gray-500 leading-relaxed"
                             />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{isRTL ? 'سعر البيع' : 'Sale Price'}</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData(p => ({ ...p, price: e.target.value }))}
                                        className="w-full px-8 py-5 bg-black text-white rounded-[1.5rem] font-black text-2xl tracking-tighter outline-none"
                                        required
                                    />
                                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-white/30 font-black text-xs">{t.rial}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{isRTL ? 'القسم' : 'Category'}</label>
                                <select
                                    value={formData.categoryId}
                                    onChange={(e) => setFormData(p => ({ ...p, categoryId: e.target.value }))}
                                    className="w-full px-8 py-5 bg-gray-50 border border-transparent focus:border-black hover:bg-gray-100 rounded-[1.5rem] font-black appearance-none cursor-pointer outline-none"
                                    required
                                >
                                    <option value="">{isRTL ? 'اختر القسم' : 'Select'}</option>
                                    {mockCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div>
                             <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 block">{isRTL ? 'معرض الصور (بريميوم)' : 'Visual Assets'}</label>
                             <div className="grid grid-cols-3 gap-4">
                                {formData.images.map((img, idx) => (
                                    <div key={img.id} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-transparent hover:border-black transition-all group">
                                        <img src={img.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
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
                                        const url = prompt(isRTL ? 'رابط الصورة:' : 'Image URL:');
                                        if (url) setFormData(p => ({ ...p, images: [...p.images, { id: `img-${Date.now()}`, url, isPrimary: p.images.length === 0 }] }));
                                    }}
                                    className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl hover:border-black hover:bg-gray-50 transition-all text-gray-400 hover:text-black gap-2"
                                >
                                    <Plus className="w-6 h-6" />
                                    <span className="text-[8px] font-black uppercase tracking-widest">{isRTL ? 'إضافة' : 'Add'}</span>
                                </button>
                             </div>
                        </div>

                        <div className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 flex flex-col items-center gap-6 justify-center">
                            <p className="text-xs font-bold text-gray-400 text-center max-w-[200px]">{isRTL ? 'بعد المراجعة، اضغط على زر الحفظ أدناه لنشر المنتج.' : 'After review, click the button below to publish.'}</p>
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full py-5 bg-black text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-800 disabled:opacity-50 shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                {isSaving ? <Loader className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                {isRTL ? 'نشر المنتج الآن' : 'Publish Product'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </form>
      )}
    </div>
  );
};

export default ImportProductPage;
