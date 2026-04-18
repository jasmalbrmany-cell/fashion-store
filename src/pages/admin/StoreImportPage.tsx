import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Loader, Check, X, Globe, Package, 
  Search, ShoppingBag, RefreshCw, AlertCircle,
  Download, Zap, Tag, Image as ImageIcon, Eye,
  ChevronDown, Store, ArrowRight, CheckCircle2, Upload, FileText
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { productsService, categoriesService } from '@/services/api';
import { mockCategories } from '@/data/mockData';
import { Category } from '@/types';

interface CatalogProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  sizes: string[];
  colors: { name: string; hex: string }[];
  sourceUrl: string;
  category: string;
  selected: boolean;
  status: 'idle' | 'saving' | 'saved' | 'error';
}

const StoreImportPage: React.FC = () => {
  const { isRTL } = useLanguage();
  const navigate = useNavigate();

  // Wizard step: 1=URL, 2=Category, 3=Products, 4=Done
  const [step, setStep] = useState(1);

  // Step 1
  const [storeUrl, setStoreUrl] = useState('');
  const [savedStores, setSavedStores] = useState<{id:string;name:string;url:string}[]>([]);

  // Step 2
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // Step 3
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [strategy, setStrategy] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [nextPage, setNextPage] = useState(2);
  const [error, setError] = useState('');
  const [filterText, setFilterText] = useState('');

  // Step 4
  const [isSaving, setIsSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [totalDone, setTotalDone] = useState(false);

  // Preview
  const [previewProduct, setPreviewProduct] = useState<CatalogProduct | null>(null);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);

  useEffect(() => {
    setIsLoadingCategories(true);
    categoriesService.getAll().then(data => {
      setCategories(data || []);
      setIsLoadingCategories(false);
    }).catch(() => {
      setIsLoadingCategories(false);
    });
    // Load saved stores
    try {
      const saved = localStorage.getItem('demo_external_stores');
      if (saved) setSavedStores(JSON.parse(saved));
    } catch (e) {
      // Ignore localStorage errors
    }
  }, []);

  const fetchCatalog = async (url: string, page = 1) => {
    setIsLoading(true);
    setError('');
    if (page === 1) {
      setProducts([]);
      setStrategy('');
      setSavedCount(0);
      setTotalDone(false);
    }

    try {
      const res = await fetch('/api/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, page })
      });
      const data = await res.json();

      if (data.success && data.products?.length > 0) {
        const newProds: CatalogProduct[] = data.products.map((p: any) => ({
          ...p,
          selected: true,
          status: 'idle'
        }));
        setProducts(prev => page === 1 ? newProds : [...prev, ...newProds]);
        setStrategy(data.strategy || '');
        setHasMore(data.hasMore || false);
        setNextPage(data.nextPage || page + 1);
        setStep(3);
      } else {
        setError(data.error || (isRTL ? 'لم يتم العثور على منتجات. تأكد من الرابط.' : 'No products found. Check the URL.'));
      }
    } catch (err: any) {
      setError(isRTL ? 'فشل الاتصال. تحقق من اتصالك بالإنترنت.' : 'Connection failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setStoreUrl(file.name);
    setStrategy('csv-import');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        if (lines.length < 2) throw new Error(isRTL ? 'ملف CSV فارغ أو لا يحتوي على بيانات' : 'CSV file is empty or has no data');

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const parsedProducts: CatalogProduct[] = [];

        for (let i = 1; i < lines.length; i++) {
          // simple csv split that handles commas inside quotes
          const match = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
          const cells = match ? match.map(m => m.replace(/^"|"$/g, '').trim()) : lines[i].split(',');

          const obj: any = {};
          headers.forEach((h, idx) => {
             obj[h] = cells[idx] || '';
          });

          // Fallbacks for common naming conventions
          const name = obj.name || obj.title || obj.product_name || `Product ${i}`;
          const price = parseFloat(obj.price || obj.regular_price || obj.sale_price) || 0;
          const image = obj.image || obj.imageurl || obj.images || obj.image_src;
          const images = image ? image.split('|').map((s:string) => s.trim()) : [];

          parsedProducts.push({
            id: `csv-${Date.now()}-${i}`,
            name,
            description: obj.description || obj.short_description || '',
            price,
            currency: 'YER',
            images,
            sizes: obj.sizes ? obj.sizes.split('|').map((s:string) => s.trim()) : [],
            colors: obj.colors ? obj.colors.split('|').map((c:string) => ({ name: c.trim(), hex: '#000000'})) : [],
            sourceUrl: '',
            category: obj.category || obj.categories || '',
            selected: true,
            status: 'idle'
          });
        }

        setProducts(parsedProducts);
        setStep(2); // CSV already loaded products, skip to category selection
      } catch (err: any) {
        setError(err.message || (isRTL ? 'خطأ في قراءة الملف. تأكد من أنه بصيغة CSV صحيحة.' : 'Error reading file. Ensure it is a valid CSV.'));
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setError(isRTL ? 'خطأ في قراءة ملف CSV' : 'Error reading CSV file');
      setIsLoading(false);
    };
    reader.readAsText(file);
  };

  const handleStartImport = () => {
    if (strategy === 'csv-import') {
       // Products already loaded physically, just go to step 3
       setStep(3);
       return;
    }
    if (!storeUrl.trim() || !selectedCategory) return;
    let url = storeUrl.trim();
    if (!url.startsWith('http')) url = 'https://' + url;
    setStoreUrl(url);
    fetchCatalog(url, 1);
  };

  const loadMore = () => fetchCatalog(storeUrl, nextPage);

  const toggleProduct = (id: string) =>
    setProducts(prev => prev.map(p => p.id === id ? { ...p, selected: !p.selected } : p));

  const toggleAll = (val: boolean) =>
    setProducts(prev => prev.map(p => ({ ...p, selected: val })));

  const selectedProds = products.filter(p => p.selected && p.status === 'idle');

  const handleSaveAll = async () => {
    setIsSaving(true);
    setSavedCount(0);
    let count = 0;

    for (const prod of selectedProds) {
      setProducts(prev => prev.map(p => p.id === prod.id ? { ...p, status: 'saving' } : p));
      try {
        const ok = await productsService.create({
          name: prod.name,
          description: prod.description || (isRTL ? 'منتج مستورد' : 'Imported product'),
          price: prod.price || 0,
          categoryId: selectedCategory,
          images: prod.images.slice(0, 5).map((url, i) => ({
            id: `img-${Date.now()}-${i}`,
            url,
            isPrimary: i === 0
          })),
          sizes: prod.sizes.map((s, i) => ({ id: `s${i}`, name: s, stock: 10, priceModifier: 0 })),
          colors: prod.colors.map((c, i) => ({ id: `c${i}`, name: c.name, hex: c.hex, stock: 10 })),
          isVisible: false,
          sourceUrl: prod.sourceUrl,
          stock: 10,
        });

        if (ok) {
          count++;
          setSavedCount(count);
          setProducts(prev => prev.map(p => p.id === prod.id ? { ...p, status: 'saved', selected: false } : p));
        } else {
          throw new Error('save failed');
        }
      } catch {
        setProducts(prev => prev.map(p => p.id === prod.id ? { ...p, status: 'error' } : p));
      }
      await new Promise(r => setTimeout(r, 300));
    }

    setIsSaving(false);
    if (count > 0) {
      setTotalDone(true);
      setStep(4);
    }
  };

  const filteredProducts = products.filter(p =>
    !filterText || p.name.toLowerCase().includes(filterText.toLowerCase()) || p.category.toLowerCase().includes(filterText.toLowerCase())
  );

  const selectedCategoryName = categories.find(c => c.id === selectedCategory)?.name || '';

  const strategyLabels: Record<string, string> = {
    woocommerce: 'WooCommerce API',
    woocommerce_v3: 'WooCommerce V3',
    shopify: 'Shopify API',
    scrape: 'HTML Scrape',
    shein: 'Shein Engine',
    'shein-specialized': 'Shein Engine',
    mapped_rules: isRTL ? 'قواعد دقيقة (API المخصص)' : 'Dynamic Rule Mapping',
    'direct-fetch': isRTL ? 'استخراج مباشر' : 'Direct Extract',
    'html-proxy': isRTL ? 'استخراج عبر وسيط' : 'Proxy Extract',
    jina: 'Jina AI Reader',
    firecrawl: 'Firecrawl AI',
    'csv-import': isRTL ? 'ملف CSV محلي' : 'Local CSV File',
    none: isRTL ? 'لم يتم العثور' : 'Not Found',
  };

  return (
    <div className="space-y-6 pb-20" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* Product Preview Modal */}
      {previewProduct && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setPreviewProduct(null)}>
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            {previewProduct.images.length > 0 ? (
              <div className="relative h-72 bg-gray-100">
                <img src={previewProduct.images[currentImageIdx]} alt="" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                {previewProduct.images.length > 1 && (
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                    {previewProduct.images.map((_, i) => (
                      <button key={i} onClick={() => setCurrentImageIdx(i)}
                        className={`w-2 h-2 rounded-full transition-all ${i === currentImageIdx ? 'bg-black w-6' : 'bg-white/60'}`} />
                    ))}
                  </div>
                )}
                <button onClick={() => setPreviewProduct(null)} className="absolute top-4 right-4 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="h-32 bg-gray-100 flex items-center justify-center">
                <ImageIcon className="w-10 h-10 text-gray-300" />
              </div>
            )}
            <div className="p-6 space-y-3">
              <h3 className="font-black text-gray-900 text-lg">{previewProduct.name}</h3>
              <p className="text-2xl font-black text-black">{previewProduct.price > 0 ? `${previewProduct.price.toLocaleString()} ${previewProduct.currency}` : isRTL ? 'بدون سعر' : 'No price'}</p>
              <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">{previewProduct.description}</p>
              <div className="flex flex-wrap gap-2">
                {previewProduct.sizes.slice(0, 5).map(s => (
                  <span key={s} className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold">{s}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <Link to="/admin/products" className="p-3 bg-gray-50 border rounded-xl hover:bg-black hover:text-white transition-all">
          <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">
            {isRTL ? '🛒 استيراد منتجات' : '🛒 Import Products'}
          </h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
            {isRTL ? 'ألصق رابط متجر واستورد منتجاته بسهولة' : 'Paste a store URL and import products easily'}
          </p>
        </div>
      </div>

      {/* Steps Progress */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between relative">
          {/* Progress line */}
          <div className="absolute top-5 left-8 right-8 h-0.5 bg-gray-200 z-0" />
          <div className="absolute top-5 left-8 h-0.5 bg-black z-0 transition-all duration-500"
            style={{ width: step === 1 ? '0%' : step === 2 ? '33%' : step === 3 ? '66%' : '85%' }}
          />

          {[
            { num: 1, label: isRTL ? 'الرابط' : 'URL' },
            { num: 2, label: isRTL ? 'القسم' : 'Category' },
            { num: 3, label: isRTL ? 'المنتجات' : 'Products' },
            { num: 4, label: isRTL ? 'تم' : 'Done' },
          ].map(s => (
            <div key={s.num} className="flex flex-col items-center z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black border-2 transition-all duration-300 ${
                step > s.num ? 'bg-black text-white border-black' :
                step === s.num ? 'bg-white text-black border-black shadow-lg' :
                'bg-gray-100 text-gray-400 border-gray-200'
              }`}>
                {step > s.num ? <Check className="w-5 h-5" /> : s.num}
              </div>
              <span className={`text-xs font-black mt-2 uppercase tracking-widest ${
                step >= s.num ? 'text-black' : 'text-gray-300'
              }`}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════ STEP 1: URL ═══════════════ */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-5">
              <Globe className="w-64 h-64" />
            </div>
            <div className="relative z-10 space-y-5">
              <div>
                <h2 className="text-2xl font-black">{isRTL ? 'الخطوة 1: أدخل رابط المتجر' : 'Step 1: Enter Store URL'}</h2>
                <p className="text-white/50 text-sm font-bold mt-1">
                  {isRTL ? 'ألصق رابط أي متجر (WooCommerce, Shopify, Shein) واضغط التالي' : 'Paste any store URL (WooCommerce, Shopify, Shein) and click Next'}
                </p>
              </div>

              {/* Saved stores shortcuts */}
              {savedStores.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-black uppercase tracking-widest text-white/30">
                    {isRTL ? 'المتاجر المحفوظة:' : 'Saved Stores:'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {savedStores.map(s => (
                      <button
                        key={s.id}
                        onClick={() => setStoreUrl(s.url)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                          storeUrl === s.url
                            ? 'bg-white text-black'
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                        }`}
                      >
                        <Store className="w-3 h-3 inline mr-1" />
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <input
                type="url"
                value={storeUrl}
                onChange={e => setStoreUrl(e.target.value)}
                placeholder={isRTL ? 'https://pletino.com أو أي رابط متجر...' : 'https://pletino.com or any store URL...'}
                className="w-full px-6 py-5 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-white/30 font-bold outline-none focus:border-white/60 transition-all text-lg"
              />

              <button
                onClick={() => storeUrl.trim() && setStep(2)}
                disabled={!storeUrl.trim()}
                className="w-full py-5 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-yellow-400 transition-all active:scale-[0.99] disabled:opacity-30 flex items-center justify-center gap-3"
              >
                {isRTL ? 'التالي: اختر القسم' : 'Next: Choose Category'}
                <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
              </button>

              <div className="flex items-center gap-4 my-2 opacity-50">
                <div className="flex-1 h-px bg-white"></div>
                <span className="text-xs font-black uppercase tracking-widest">{isRTL ? 'أو' : 'OR'}</span>
                <div className="flex-1 h-px bg-white"></div>
              </div>

              <div className="w-full relative bg-white/5 border-2 border-dashed border-white/20 rounded-2xl p-6 text-center hover:bg-white/10 hover:border-white/40 transition-all cursor-pointer flex flex-col items-center justify-center gap-3">
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={handleCsvUpload} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                  title={isRTL ? 'ارفع ملف CSV' : 'Upload CSV file'}
                />
                <FileText className="w-8 h-8 text-white/50" />
                <div>
                  <p className="text-sm font-black text-white">{isRTL ? 'استيراد من ملف CSV' : 'Import from CSV File'}</p>
                  <p className="text-xs text-white/50 font-bold mt-1">
                    {isRTL ? 'الأعمدة المدعومة: name, price, description, images, sizes' : 'Supported cols: name, price, description, images, sizes'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Supported sites info */}
          <div className="bg-gray-50 rounded-2xl p-6 space-y-3">
            <p className="font-black text-sm text-gray-700">{isRTL ? '🔥 المواقع المدعومة:' : '🔥 Supported Sites:'}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <p className="font-black text-sm">✅ WooCommerce</p>
                <p className="text-xs text-gray-400 mt-1">{isRTL ? 'مثل Pletino.com — استيراد كامل تلقائي' : 'Like Pletino.com — Full auto import'}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <p className="font-black text-sm">✅ Shopify</p>
                <p className="text-xs text-gray-400 mt-1">{isRTL ? 'أغلب متاجر Shopify — بيانات كاملة' : 'Most Shopify stores — Full data'}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <p className="font-black text-sm">🌐 {isRTL ? 'أي موقع آخر' : 'Any Website'}</p>
                <p className="text-xs text-gray-400 mt-1">{isRTL ? 'Zahraah, Noon, Namshi... — استخراج ذكي' : 'Zahraah, Noon, Namshi... — Smart extraction'}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <p className="font-black text-sm">👗 Shein</p>
                <p className="text-xs text-gray-400 mt-1">{isRTL ? 'محرك متخصص لـ Shein' : 'Specialized Shein engine'}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <p className="font-black text-sm">🛍️ Amazon</p>
                <p className="text-xs text-gray-400 mt-1">{isRTL ? 'Amazon.sa / Amazon.com' : 'Amazon.sa / Amazon.com'}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <p className="font-black text-sm">🔗 AliExpress</p>
                <p className="text-xs text-gray-400 mt-1">{isRTL ? 'استيراد من AliExpress' : 'Import from AliExpress'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ STEP 2: CATEGORY ═══════════════ */}
      {step === 2 && (
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900">{isRTL ? 'الخطوة 2: اختر القسم' : 'Step 2: Choose Category'}</h2>
            <p className="text-gray-400 text-sm font-bold mt-1">
              {isRTL ? 'حدد القسم الذي ستُضاف إليه المنتجات المستوردة' : 'Select the category where imported products will be added'}
            </p>
          </div>

          {/* Show selected URL */}
          <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-3">
            <Globe className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <span className="font-bold text-sm text-gray-700 truncate">{storeUrl}</span>
            <button onClick={() => setStep(1)} className="text-xs text-blue-600 font-bold hover:underline flex-shrink-0">
              {isRTL ? 'تغيير' : 'Change'}
            </button>
          </div>

          {/* Category grid */}
          {isLoadingCategories ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader className="w-8 h-8 animate-spin text-gray-400" />
              <p className="text-sm font-bold text-gray-400">{isRTL ? 'جاري تحميل الأقسام...' : 'Loading categories...'}</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <Tag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-500">{isRTL ? 'لم يتم العثور على أقسام. يرجى إضافة قسم من لوحة التحكم أولاً.' : 'No categories found. Please add a category first.'}</p>
              <Link to="/admin/categories" className="text-xs text-black font-black uppercase tracking-widest mt-4 inline-block hover:underline">
                {isRTL ? '+ إضافة قسم الآن' : '+ Add Category Now'}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`p-4 rounded-2xl border-2 transition-all text-center ${
                    selectedCategory === cat.id
                      ? 'border-black bg-black text-white shadow-lg'
                      : 'border-gray-100 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Tag className={`w-5 h-5 mx-auto mb-2 ${selectedCategory === cat.id ? 'text-white' : 'text-gray-300'}`} />
                  <p className="font-black text-sm">{cat.name}</p>
                </button>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-all"
            >
              {isRTL ? '← السابق' : '← Back'}
            </button>
            <button
              onClick={handleStartImport}
              disabled={!selectedCategory || isLoading}
              className="flex-[2] py-4 bg-black text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-800 transition-all disabled:opacity-30 flex items-center justify-center gap-3"
            >
              {isLoading
                ? <><Loader className="w-5 h-5 animate-spin" />{isRTL ? 'جارٍ المعالجة...' : 'Processing...'}</>
                : <><Zap className="w-5 h-5" />{isRTL ? (strategy === 'csv-import' ? 'معاينة المنتجات' : 'بدء الاستخراج') : (strategy === 'csv-import' ? 'Preview Products' : 'Start Extract')}</>
              }
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">{error}</p>
                <button onClick={() => { setError(''); setStep(1); }} className="text-xs mt-1 underline">
                  {isRTL ? 'جرب رابطاً آخر' : 'Try a different URL'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ STEP 3: PRODUCTS ═══════════════ */}
      {step === 3 && (
        <div className="space-y-4">
          {/* Info bar */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm text-gray-500 truncate">
                <Globe className="w-4 h-4 flex-shrink-0" />
                <span className="font-bold truncate">{storeUrl}</span>
              </div>
              {strategy && (
                <span className="text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded-full whitespace-nowrap">
                  {strategyLabels[strategy] || strategy}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Tag className="w-4 h-4 text-gray-400" />
              <span className="font-black text-black">{selectedCategoryName}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[160px]">
              <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300`} />
              <input
                type="text"
                value={filterText}
                onChange={e => setFilterText(e.target.value)}
                placeholder={isRTL ? 'بحث في المنتجات...' : 'Search products...'}
                className={`w-full ${isRTL ? 'pr-9 pl-4' : 'pl-9 pr-4'} py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-black`}
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => toggleAll(true)} className="px-3 py-2 text-xs font-black uppercase tracking-widest bg-gray-50 hover:bg-black hover:text-white rounded-xl transition">
                {isRTL ? 'الكل' : 'All'}
              </button>
              <button onClick={() => toggleAll(false)} className="px-3 py-2 text-xs font-black uppercase tracking-widest bg-gray-50 hover:bg-black hover:text-white rounded-xl transition">
                {isRTL ? 'لا شيء' : 'None'}
              </button>
            </div>
            <span className="text-sm font-bold text-gray-500">
              {filteredProducts.length} {isRTL ? 'منتج' : 'products'}
            </span>
          </div>

          {/* Loading shimmer */}
          {isLoading && products.length === 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                  <div className="h-48 bg-gray-100" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-gray-100 rounded-full w-3/4" />
                    <div className="h-3 bg-gray-100 rounded-full w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Product Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map(prod => (
              <div
                key={prod.id}
                onClick={() => prod.status === 'idle' && toggleProduct(prod.id)}
                className={`bg-white rounded-2xl overflow-hidden border-2 transition-all cursor-pointer group relative
                  ${prod.status === 'saved' ? 'border-green-400 opacity-60' :
                    prod.status === 'error' ? 'border-red-400' :
                    prod.selected ? 'border-black shadow-lg scale-[1.01]' :
                    'border-gray-100 hover:border-gray-300'}`}
              >
                {/* Status badges */}
                {prod.status === 'saved' && (
                  <div className="absolute top-2 right-2 z-10 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
                {prod.status === 'saving' && (
                  <div className="absolute top-2 right-2 z-10 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <Loader className="w-3 h-3 text-white animate-spin" />
                  </div>
                )}
                {prod.status === 'idle' && prod.selected && (
                  <div className="absolute top-2 right-2 z-10 w-6 h-6 bg-black rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}

                {/* Image */}
                <div className="relative h-44 bg-gray-50 overflow-hidden">
                  {prod.images.length > 0 ? (
                    <img src={prod.images[0]} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={e => { e.currentTarget.style.display = 'none'; }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-10 h-10 text-gray-200" />
                    </div>
                  )}
                  {prod.images.length > 1 && (
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 text-white text-xs font-bold rounded-full">
                      {prod.images.length} 📷
                    </div>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); setCurrentImageIdx(0); setPreviewProduct(prod); }}
                    className="absolute top-2 left-2 w-7 h-7 bg-white/80 backdrop-blur rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-white"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>

                {/* Info */}
                <div className="p-3 space-y-1">
                  <p className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight">{prod.name || (isRTL ? 'بدون اسم' : 'No name')}</p>
                  <p className="text-base font-black text-black">
                    {prod.price > 0 ? `${prod.price.toLocaleString()} ${prod.currency}` : (isRTL ? 'سعر غير محدد' : 'No price')}
                  </p>
                  {prod.sizes.length > 0 && prod.sizes[0] !== 'حسب الطلب' && (
                    <p className="text-xs text-gray-400 font-semibold truncate">
                      📏 {prod.sizes.slice(0, 3).join(' · ')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          {hasMore && !isLoading && (
            <button onClick={loadMore}
              className="w-full py-4 bg-white border-2 border-gray-200 rounded-2xl font-black text-sm uppercase tracking-widest hover:border-black hover:bg-black hover:text-white transition-all flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4" />
              {isRTL ? 'تحميل المزيد' : 'Load More'}
            </button>
          )}

          {isLoading && products.length > 0 && (
            <div className="flex items-center justify-center py-6 gap-3">
              <Loader className="w-5 h-5 animate-spin" />
              <span className="font-bold text-gray-500">{isRTL ? 'جارٍ التحميل...' : 'Loading...'}</span>
            </div>
          )}

          {/* Save Footer */}
          {selectedProds.length > 0 && (
            <div className="fixed bottom-4 left-4 right-4 z-50 max-w-2xl mx-auto">
              <div className="bg-black rounded-2xl p-4 flex items-center gap-3 shadow-2xl shadow-black/40">
                <div className="flex-1">
                  <p className="text-white font-black text-sm">
                    {isRTL ? `${selectedProds.length} منتج محدد` : `${selectedProds.length} selected`}
                  </p>
                  <p className="text-green-400 text-xs font-bold">
                    → {selectedCategoryName}
                  </p>
                </div>
                {isSaving && (
                  <span className="text-white/60 text-sm font-bold">
                    {savedCount}/{selectedProds.length}
                  </span>
                )}
                <button
                  onClick={handleSaveAll}
                  disabled={isSaving}
                  className="px-6 py-3 bg-white text-black rounded-xl font-black text-sm uppercase tracking-widest hover:bg-yellow-400 transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                >
                  {isSaving
                    ? <><Loader className="w-4 h-4 animate-spin" /> {isRTL ? 'يحفظ...' : 'Saving...'}</>
                    : <><Download className="w-4 h-4" /> {isRTL ? 'حفظ في المتجر' : 'Save to Store'}</>
                  }
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ STEP 4: DONE ═══════════════ */}
      {step === 4 && (
        <div className="bg-white rounded-3xl p-12 text-center space-y-8 border border-gray-100 shadow-sm">
          <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-green-200">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-900">{isRTL ? '🎉 تم الاستيراد بنجاح!' : '🎉 Import Complete!'}</h2>
            <p className="text-gray-500 mt-3 font-bold text-lg">
              {isRTL ? `تمت إضافة ${savedCount} منتج إلى قسم "${selectedCategoryName}"` : `${savedCount} products added to "${selectedCategoryName}"`}
            </p>
            <p className="text-gray-400 mt-1 text-sm">
              {isRTL ? 'المنتجات مخفية حالياً — يمكنك مراجعتها وإظهارها من صفحة المنتجات' : 'Products are hidden by default — review and publish them from the Products page'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <button onClick={() => navigate('/admin/products')}
              className="flex-1 py-4 bg-black text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center justify-center gap-2">
              <Package className="w-4 h-4" />
              {isRTL ? 'عرض المنتجات' : 'View Products'}
            </button>
            <button onClick={() => { setStep(1); setProducts([]); setStoreUrl(''); setSelectedCategory(''); setSavedCount(0); setTotalDone(false); }}
              className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4" />
              {isRTL ? 'استيراد آخر' : 'Import More'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreImportPage;
