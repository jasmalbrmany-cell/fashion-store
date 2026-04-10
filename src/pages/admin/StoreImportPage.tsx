import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Loader, Check, X, Globe, Package, ChevronRight,
  ChevronLeft, Search, ShoppingBag, RefreshCw, AlertCircle,
  Download, Filter, Zap, Tag, Image as ImageIcon, Eye
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

const STORE_PRESETS = [
  { name: 'Pletino', url: 'https://pletino.com', emoji: '👶' },
  { name: 'مثال WooCommerce', url: 'https://woocommerce.com', emoji: '🛒' },
];

const StoreImportPage: React.FC = () => {
  const { isRTL, t } = useLanguage();
  const navigate = useNavigate();

  const [storeUrl, setStoreUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [strategy, setStrategy] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [nextPage, setNextPage] = useState(2);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [totalDone, setTotalDone] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [previewProduct, setPreviewProduct] = useState<CatalogProduct | null>(null);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);

  useEffect(() => {
    categoriesService.getAll().then(data => {
      if (data && data.length > 0) setCategories(data);
    });
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
      } else {
        setError(data.error || (isRTL ? 'لم يتم العثور على منتجات. تأكد من الرابط.' : 'No products found. Check the URL.'));
      }
    } catch (err: any) {
      setError(isRTL ? 'فشل الاتصال. تحقق من اتصالك بالإنترنت.' : 'Connection failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = () => {
    if (!storeUrl.trim()) return;
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
    if (!selectedCategory) {
      alert(isRTL ? 'يرجى اختيار القسم أولاً!' : 'Please select a category first!');
      return;
    }

    setIsSaving(true);
    setSavedCount(0);
    let count = 0;

    for (const prod of selectedProds) {
      setProducts(prev => prev.map(p => p.id === prod.id ? { ...p, status: 'saving' } : p));
      try {
        const ok = await productsService.create({
          name: prod.name,
          description: prod.description || (isRTL ? 'منتج مستورد من ' + storeUrl : 'Imported from ' + storeUrl),
          price: prod.price || 0,
          categoryId: selectedCategory,
          images: prod.images.slice(0, 5).map((url, i) => ({
            id: `img-${Date.now()}-${i}`,
            url,
            isPrimary: i === 0
          })),
          sizes: prod.sizes.map((s, i) => ({ id: `s${i}`, name: s, stock: 10, priceModifier: 0 })),
          colors: prod.colors.map((c, i) => ({ id: `c${i}`, name: c.name, hex: c.hex, stock: 10 })),
          isVisible: false, // Default to hidden for admin review
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
    if (count > 0) setTotalDone(true);
  };

  const filteredProducts = products.filter(p =>
    !filterText || p.name.includes(filterText) || p.category.includes(filterText)
  );

  const strategyLabel: Record<string, string> = {
    woocommerce: isRTL ? '✅ WooCommerce API (بيانات كاملة)' : '✅ WooCommerce API (Full data)',
    woocommerce_v3: isRTL ? '✅ WooCommerce V3 API' : '✅ WooCommerce V3 API',
    shopify: isRTL ? '✅ Shopify API (بيانات كاملة)' : '✅ Shopify API (Full data)',
    scrape: isRTL ? '⚡ HTML سحب من الصفحة' : '⚡ HTML Scraping mode',
  };

  return (
    <div className="space-y-6 pb-20" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* Success Modal */}
      {totalDone && (
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-10 max-w-sm w-full text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900">{isRTL ? '🎉 تم الاستيراد!' : '🎉 Import Done!'}</h2>
              <p className="text-gray-500 mt-2 font-semibold">
                {isRTL ? `تمت إضافة ${savedCount} منتج إلى متجرك بنجاح!` : `${savedCount} products added to your store!`}
              </p>
            </div>
            <button onClick={() => navigate('/admin/products')}
              className="w-full py-4 bg-black text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-800 transition-all">
              {isRTL ? 'عرض المنتجات' : 'View Products'}
            </button>
            <button onClick={() => setTotalDone(false)} className="text-sm text-gray-400 font-bold hover:text-black transition">
              {isRTL ? 'متابعة الاستيراد' : 'Continue Importing'}
            </button>
          </div>
        </div>
      )}

      {/* Product Preview Modal */}
      {previewProduct && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setPreviewProduct(null)}>
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
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
              <div className="flex gap-2">
                {previewProduct.colors.map(c => (
                  <div key={c.name} className="w-6 h-6 rounded-full border-2 border-white shadow" style={{ background: c.hex }} title={c.name} />
                ))}
              </div>
              {previewProduct.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto py-2">
                  {previewProduct.images.map((img, i) => (
                    <img key={i} src={img} alt="" className={`w-16 h-16 object-cover rounded-xl flex-shrink-0 cursor-pointer border-2 transition ${i === currentImageIdx ? 'border-black' : 'border-transparent'}`}
                      onClick={() => setCurrentImageIdx(i)} onError={e => e.currentTarget.remove()} />
                  ))}
                </div>
              )}
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
            {isRTL ? '🏪 استيراد من متجر كامل' : '🏪 Full Store Import'}
          </h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
            {isRTL ? 'ألصق رابط أي متجر واستورد كل منتجاته دفعة واحدة' : 'Paste any store URL and import all products at once'}
          </p>
        </div>
        {strategy && (
          <span className="text-xs font-bold px-3 py-1 bg-green-100 text-green-700 rounded-full">
            {strategyLabel[strategy] || strategy}
          </span>
        )}
      </div>

      {/* URL Input Card */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 text-white space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-5">
          <Globe className="w-64 h-64" />
        </div>
        <div className="relative z-10 space-y-4">
          <h2 className="text-2xl font-black">{isRTL ? 'أدخل رابط المتجر' : 'Enter Store URL'}</h2>
          <p className="text-white/50 text-sm font-semibold">
            {isRTL
              ? 'يدعم: WooCommerce، Shopify، وأي موقع متجر. مثال: https://pletino.com'
              : 'Supports: WooCommerce, Shopify, and any store. Example: https://pletino.com'}
          </p>

          {/* Presets */}
          <div className="flex gap-2 flex-wrap">
            {STORE_PRESETS.map(p => (
              <button key={p.url} onClick={() => setStoreUrl(p.url)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition flex items-center gap-2">
                {p.emoji} {p.name}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="url"
                value={storeUrl}
                onChange={e => setStoreUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleImport()}
                placeholder="https://pletino.com"
                className="w-full px-5 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-white/30 font-bold outline-none focus:border-white/60 transition-all"
              />
            </div>
            <button
              onClick={handleImport}
              disabled={isLoading || !storeUrl.trim()}
              className="px-8 py-4 bg-white text-black rounded-2xl font-black hover:bg-yellow-400 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
            >
              {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
              {isRTL ? 'استيراد الكل' : 'Import All'}
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="font-semibold text-sm">{error}</p>
        </div>
      )}

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

      {/* Products Grid */}
      {products.length > 0 && (
        <div className="space-y-4">
          {/* Controls bar */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-wrap gap-3 items-center">
            {/* Category Select */}
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Tag className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:outline-none focus:border-black cursor-pointer"
              >
                <option value="">{isRTL ? '🏷️ اختر القسم للمنتجات' : '🏷️ Select Category'}</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* Filter */}
            <div className="relative flex-1 min-w-[160px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input
                type="text"
                value={filterText}
                onChange={e => setFilterText(e.target.value)}
                placeholder={isRTL ? 'فلتر المنتجات...' : 'Filter...'}
                className="w-full pr-9 pl-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-black"
              />
            </div>

            {/* Select all / none */}
            <div className="flex gap-2">
              <button onClick={() => toggleAll(true)} className="px-3 py-2 text-xs font-black uppercase tracking-widest bg-gray-50 hover:bg-black hover:text-white rounded-xl transition">
                {isRTL ? 'تحديد الكل' : 'All'}
              </button>
              <button onClick={() => toggleAll(false)} className="px-3 py-2 text-xs font-black uppercase tracking-widest bg-gray-50 hover:bg-black hover:text-white rounded-xl transition">
                {isRTL ? 'إلغاء' : 'None'}
              </button>
            </div>

            {/* Count */}
            <span className="text-sm font-bold text-gray-500">
              {isRTL ? `${filteredProducts.length} منتج` : `${filteredProducts.length} products`}
            </span>
          </div>

          {/* Product Cards Grid */}
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
                {/* Status badge */}
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
                    <img
                      src={prod.images[0]}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={e => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-10 h-10 text-gray-200" />
                    </div>
                  )}

                  {/* Image count */}
                  {prod.images.length > 1 && (
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 text-white text-xs font-bold rounded-full">
                      {prod.images.length} 📷
                    </div>
                  )}

                  {/* Preview button */}
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
                      {prod.sizes.length > 3 && ` +${prod.sizes.length - 3}`}
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
              {isRTL ? 'تحميل المزيد من المنتجات' : 'Load More Products'}
            </button>
          )}

          {isLoading && products.length > 0 && (
            <div className="flex items-center justify-center py-6 gap-3">
              <Loader className="w-5 h-5 animate-spin" />
              <span className="font-bold text-gray-500">{isRTL ? 'جاري التحميل...' : 'Loading...'}</span>
            </div>
          )}

          {/* Save Button - Sticky Footer */}
          {selectedProds.length > 0 && (
            <div className="fixed bottom-4 left-4 right-4 z-50 flex gap-3 max-w-2xl mx-auto">
              <div className="flex-1 bg-black rounded-2xl p-4 flex items-center gap-3 shadow-2xl shadow-black/40">
                <div className="flex-1">
                  <p className="text-white font-black text-sm">
                    {isRTL ? `${selectedProds.length} منتج محدد` : `${selectedProds.length} selected`}
                  </p>
                  {!selectedCategory && (
                    <p className="text-yellow-400 text-xs font-bold animate-pulse">
                      {isRTL ? '⚠️ اختر القسم أولاً ↑' : '⚠️ Choose a category ↑'}
                    </p>
                  )}
                  {selectedCategory && (
                    <p className="text-green-400 text-xs font-bold">
                      {isRTL ? '✅ جاهز للحفظ' : '✅ Ready to save'}
                    </p>
                  )}
                </div>
                {isSaving && (
                  <span className="text-white/60 text-sm font-bold">
                    {savedCount}/{selectedProds.length}
                  </span>
                )}
                <button
                  onClick={handleSaveAll}
                  disabled={isSaving || !selectedCategory}
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

      {/* Empty state */}
      {!isLoading && products.length === 0 && !error && (
        <div className="text-center py-20 space-y-4">
          <ShoppingBag className="w-16 h-16 text-gray-200 mx-auto" />
          <p className="text-gray-400 font-bold">
            {isRTL ? 'أدخل رابط المتجر أعلاه وسيتم استيراد المنتجات تلقائياً' : 'Enter a store URL above to start importing'}
          </p>
          <div className="bg-gray-50 rounded-2xl p-6 max-w-md mx-auto text-right space-y-2">
            <p className="font-black text-sm text-gray-700">{isRTL ? '🔥 المواقع المدعومة:' : '🔥 Supported Sites:'}</p>
            <p className="text-sm text-gray-500">✅ <strong>WooCommerce</strong> – {isRTL ? 'مثل Pletino.com' : 'like Pletino.com'}</p>
            <p className="text-sm text-gray-500">✅ <strong>Shopify</strong> – {isRTL ? 'أغلب متاجر Shopify' : 'Most Shopify stores'}</p>
            <p className="text-sm text-gray-500">⚡ <strong>{isRTL ? 'مواقع أخرى' : 'Other sites'}</strong> – {isRTL ? 'سحب HTML تلقائي' : 'Auto HTML scrape'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreImportPage;
