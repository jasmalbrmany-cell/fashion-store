import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Upload, Check, Globe, Edit3, X, AlertTriangle, Terminal, Loader, Zap } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { productsService } from '@/services/api';

interface ManualProduct {
  id: string;
  name: string;
  price: string;
  imageUrl: string;
  description: string;
  sourceUrl: string;
  status: 'idle' | 'loading' | 'success' | 'error';
}

const emptyProduct = (): ManualProduct => ({
  id: Math.random().toString(36).substr(2, 9),
  name: '',
  price: '',
  imageUrl: '',
  description: '',
  sourceUrl: '',
  status: 'idle',
});

const BulkImportPage: React.FC = () => {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'direct' | 'url' | 'smart'>('smart');

  // ---- DIRECT ADD STATE ----
  const [manualProducts, setManualProducts] = useState<ManualProduct[]>([emptyProduct()]);

  // Auto-fill from Bookmarklet URL parameters
  useEffect(() => {
    if (searchParams.get('autofill') === 'true') {
      setActiveTab('direct');
      setManualProducts([{
        id: Math.random().toString(36).substr(2, 9),
        name: searchParams.get('name') || '',
        price: searchParams.get('price') || '45000',
        imageUrl: searchParams.get('img') || '',
        description: '',
        sourceUrl: searchParams.get('source') || '',
        status: 'idle',
      }]);
      // Clean URL to prevent re-triggering on refresh
      navigate('/admin/products/bulk', { replace: true });
    }
  }, [searchParams, navigate]);
  const [isDirectImporting, setIsDirectImporting] = useState(false);
  const [directSuccess, setDirectSuccess] = useState(0);
  const [directDone, setDirectDone] = useState(false);

  const addRow = () => setManualProducts(prev => [...prev, emptyProduct()]);
  const removeRow = (id: string) => setManualProducts(prev => prev.filter(p => p.id !== id));
  const updateRow = (id: string, field: keyof ManualProduct, value: string) =>
    setManualProducts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));

  const handleDirectImport = async () => {
    const valid = manualProducts.filter(p => p.name.trim().length > 0);
    if (valid.length === 0) return;
    setIsDirectImporting(true);
    setDirectSuccess(0);
    let count = 0;

    for (const prod of valid) {
      setManualProducts(prev => prev.map(p => p.id === prod.id ? { ...p, status: 'loading' } : p));
      try {
        const result = await productsService.create({
          name: prod.name.trim(),
          description: prod.description.trim() || (isRTL ? 'منتج مستورد.' : 'Imported product.'),
          price: parseFloat(prod.price) || 45000,
          categoryId: 'cat-1',
          images: prod.imageUrl.trim()
            ? [{ id: Math.random().toString(), url: prod.imageUrl.trim(), isPrimary: true }]
            : [],
          isVisible: true,
          sourceUrl: prod.sourceUrl.trim() || undefined,
          stock: 20,
        });
        if (result) {
          count++;
          setDirectSuccess(count);
          setManualProducts(prev => prev.map(p => p.id === prod.id ? { ...p, status: 'success' } : p));
        } else {
          throw new Error('Failed');
        }
      } catch (e) {
        setManualProducts(prev => prev.map(p => p.id === prod.id ? { ...p, status: 'error' } : p));
      }
      await new Promise(r => setTimeout(r, 400));
    }
    setIsDirectImporting(false);
    if (count > 0) setDirectDone(true);
  };

  const resetDirect = () => {
    setManualProducts([emptyProduct()]);
    setDirectDone(false);
    setDirectSuccess(0);
  };

  // ---- URL SCRAPER STATE ----
  const [url, setUrl] = useState('');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [urlError, setUrlError] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [discoveredLinks, setDiscoveredLinks] = useState<{ href: string; name: string; selected: boolean }[]>([]);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeProgress, setScrapeProgress] = useState(0);
  const [scrapeSuccess, setScrapeSuccess] = useState(0);
  const [scrapeDone, setScrapeDone] = useState(false);

  const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 20));

  const handleDiscover = async () => {
    if (!url.trim()) return;
    setIsDiscovering(true);
    setUrlError('');
    setDiscoveredLinks([]);
    setLogs([]);
    addLog(isRTL ? 'بدء البحث في الموقع...' : 'Starting deep crawl...');

    try {
      const proxies = [
        `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
        `https://corsproxy.io/?${encodeURIComponent(url)}`,
      ];
      let contents = '';
      for (const px of proxies) {
        try {
          addLog(isRTL ? 'محاولة الاتصال عبر بروكسي...' : 'Trying proxy...');
          const r = await fetch(px);
          const d = await r.json();
          contents = d.contents || (typeof d === 'string' ? d : '');
          if (contents && contents.length > 500) break;
        } catch { continue; }
      }

      if (!contents) throw new Error('No content');

      const parser = new DOMParser();
      const doc = parser.parseFromString(contents, 'text/html');
      const base = new URL(url).origin;
      const seen = new Set<string>();
      const links: { href: string; name: string; selected: boolean }[] = [];

      doc.querySelectorAll('a').forEach(a => {
        let href = a.getAttribute('href');
        if (!href || href === '#' || href.includes('javascript:')) return;
        try { if (!href.startsWith('http')) href = new URL(href, base).href; } catch { return; }
        const l = href.toLowerCase();
        const isProd = (l.includes('-p-') && href.endsWith('.html'))
          || (l.includes('/products/') && !l.includes('/category/'))
          || l.includes('/product/')
          || l.includes('/item/')
          || l.includes('/dp/');
        if (isProd && !seen.has(href)) {
          seen.add(href);
          const name = a.innerText?.trim().substring(0, 60) || a.getAttribute('title')?.trim() || a.getAttribute('aria-label')?.trim() || '';
          if (name.length > 2) links.push({ href, name, selected: true });
        }
      });

      if (links.length === 0) {
        setUrlError(isRTL
          ? 'لم يتم العثور على روابط منتجات. الموقع محمي بفلتر ضد الروبوتات. استخدم وضع "الإضافة المباشرة" بدلاً من ذلك.'
          : 'No product links found. The site blocks bots. Use "Direct Add" mode instead.');
        addLog(isRTL ? '❌ لم توجد روابط.' : '❌ No links found.');
      } else {
        setDiscoveredLinks(links.slice(0, 80));
        addLog(isRTL ? `✅ اكتُشف ${links.length} رابط منتج.` : `✅ Found ${links.length} links.`);
      }
    } catch {
      setUrlError(isRTL
        ? 'فشل الاتصال. الموقع يحظر الوصول. يرجى استخدام وضع "الإضافة المباشرة" الذي يعمل دائماً.'
        : 'Connection failed. Use "Direct Add" mode — it always works.');
      addLog(isRTL ? '❌ فشل الاتصال.' : '❌ Connection failed.');
    }
    setIsDiscovering(false);
  };

  const toggleLink = (href: string) =>
    setDiscoveredLinks(prev => prev.map(l => l.href === href ? { ...l, selected: !l.selected } : l));

  const handleScrape = async () => {
    const toScrape = discoveredLinks.filter(l => l.selected);
    if (toScrape.length === 0) return;
    setIsScraping(true);
    setScrapeProgress(0);
    setScrapeSuccess(0);
    let done = 0; let success = 0;

    for (const link of toScrape) {
      addLog(isRTL ? `جاري معالجة: ${link.href.substring(0, 30)}...` : `Processing: ${link.href.substring(0, 30)}...`);
      try {
        const proxies = [
          `https://api.allorigins.win/get?url=${encodeURIComponent(link.href)}`,
          `https://corsproxy.io/?${encodeURIComponent(link.href)}`,
        ];
        let html = '';
        for (const px of proxies) {
          try { const r = await fetch(px); const d = await r.json(); html = d.contents || ''; if (html.length > 500) break; } catch { continue; }
        }
        if (!html) throw new Error('blocked');

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const hostname = new URL(link.href).hostname;
        let name = link.name;
        let imageUrl = '';

        if (hostname.includes('shein')) {
          name = doc.querySelector('.product-intro__head-name')?.textContent?.trim() || doc.querySelector('h1')?.textContent?.trim() || name;
          const img = doc.querySelector('.product-intro__main-img img')?.getAttribute('src') || '';
          imageUrl = img.startsWith('//') ? 'https:' + img : img;
        } else if (hostname.includes('zahraah')) {
          name = doc.querySelector('h1')?.textContent?.trim() || name;
          const img = doc.querySelector('.product-single__photo img')?.getAttribute('src') || '';
          imageUrl = img.startsWith('//') ? 'https:' + img : img;
        } else {
          name = doc.querySelector('h1')?.innerText?.trim() || doc.title?.split('|')[0]?.trim() || name;
          imageUrl = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';
        }

        const result = await productsService.create({
          name: name || (isRTL ? 'منتج مستورد' : 'Imported Product'),
          description: isRTL ? 'تم استيراده آلياً.' : 'Auto-imported.',
          price: 45000,
          categoryId: 'cat-1',
          images: imageUrl ? [{ id: Math.random().toString(), url: imageUrl, isPrimary: true }] : [],
          isVisible: true,
          sourceUrl: link.href,
          stock: 20,
        });

        if (result) {
          success++;
          setScrapeSuccess(success);
          addLog(isRTL ? `✅ تم: ${name.substring(0, 25)}` : `✅ Done: ${name.substring(0, 25)}`);
          setDiscoveredLinks(prev => prev.map(l => l.href === link.href ? { ...l, selected: false } : l));
        } else throw new Error('save failed');
      } catch {
        addLog(isRTL ? `❌ فشل: ${link.href.substring(0, 25)}` : `❌ Failed: ${link.href.substring(0, 25)}`);
      }
      done++;
      setScrapeProgress(Math.round((done / toScrape.length) * 100));
      await new Promise(r => setTimeout(r, 800));
    }
    setIsScraping(false);
    if (success > 0) setScrapeDone(true);
  };

  const statusIcon = (status: ManualProduct['status']) => {
    if (status === 'loading') return <Loader className="w-4 h-4 animate-spin text-blue-500" />;
    if (status === 'success') return <Check className="w-4 h-4 text-green-500" />;
    if (status === 'error') return <X className="w-4 h-4 text-red-500" />;
    return null;
  };

  return (
    <div className="space-y-6 pb-32" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* Success overlay for direct add */}
      {directDone && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-10 max-w-sm w-full text-center space-y-6 shadow-2xl">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-200">
              <Check className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900">{isRTL ? '🎉 نجاح الاستيراد!' : '🎉 Import Success!'}</h2>
              <p className="text-gray-500 mt-1 font-semibold">
                {isRTL ? `تمت إضافة ${directSuccess} منتجات إلى متجرك بنجاح.` : `${directSuccess} products added to your store successfully.`}
              </p>
            </div>
            <button onClick={() => window.location.href = '/admin/products'}
              className="w-full py-4 bg-black text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-800 transition-all">
              {isRTL ? 'عرض المنتجات في المتجر' : 'View Products'}
            </button>
            <button onClick={resetDirect} className="text-xs text-gray-400 font-bold hover:text-black transition">
              {isRTL ? 'إضافة منتجات أخرى' : 'Add More'}
            </button>
          </div>
        </div>
      )}

      {/* Success overlay for url scraper */}
      {scrapeDone && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-10 max-w-sm w-full text-center space-y-6 shadow-2xl">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900">{isRTL ? '🎉 اكتمل الاستيراد!' : '🎉 Done!'}</h2>
              <p className="text-gray-500 mt-1 font-semibold">
                {isRTL ? `تمت إضافة ${scrapeSuccess} منتجات.` : `${scrapeSuccess} products imported.`}
              </p>
            </div>
            <button onClick={() => window.location.href = '/admin/products'}
              className="w-full py-4 bg-black text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-800 transition-all">
              {isRTL ? 'عرض المتجر' : 'View Store'}
            </button>
            <button onClick={() => setScrapeDone(false)} className="text-xs text-gray-400 font-bold hover:text-black transition">
              {isRTL ? 'متابعة' : 'Continue'}
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <Link to="/admin/products" className="p-3 bg-gray-50 border rounded-xl hover:bg-black hover:text-white transition-all">
          <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
        </Link>
        <div>
          <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">{isRTL ? 'الاستيراد الشامل' : 'Bulk Importer'}</h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">{isRTL ? 'أضف منتجات كثيرة دفعة واحدة' : 'Add many products at once'}</p>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-3">
        <button onClick={() => setActiveTab('smart')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm uppercase tracking-widest border-2 transition-all ${activeTab === 'smart' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200' : 'bg-white border-gray-200 text-gray-500 hover:border-indigo-600 hover:text-indigo-600'}`}>
          <Zap className="w-5 h-5" />
          {isRTL ? 'السحب الذكي (الأداة السحرية)' : 'Smart Extractor'}
        </button>
        <button onClick={() => setActiveTab('direct')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm uppercase tracking-widest border-2 transition-all ${activeTab === 'direct' ? 'bg-black text-white border-black' : 'bg-white border-gray-200 text-gray-500 hover:border-black'}`}>
          <Edit3 className="w-4 h-4" />
          {isRTL ? 'إضافة مباشرة يدوية' : 'Manual Direct Add'}
        </button>
        <button onClick={() => setActiveTab('url')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm uppercase tracking-widest border-2 transition-all ${activeTab === 'url' ? 'bg-black text-white border-black' : 'bg-white border-gray-200 text-gray-500 hover:border-black'}`}>
          <Globe className="w-4 h-4" />
          {isRTL ? 'استيراد من رابط' : 'Import from URL'}
        </button>
      </div>

      {/* ==================== SMART EXTRACTOR TAB ==================== */}
      {activeTab === 'smart' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-3xl p-8 shadow-sm">
            <h2 className="text-2xl font-black text-indigo-900 mb-2">{isRTL ? 'الزر السحري لشفط المنتجات ⚡' : 'The Magic Import Button ⚡'}</h2>
            <p className="text-indigo-700 font-semibold mb-6 max-w-2xl leading-relaxed">
              {isRTL 
                ? 'الحل الأمثل والسريع للمواقع المحمية مثل (شي إن) و (زهراء). الأداة السحرية تعمل داخل متصفحك وتقوم بسحب البيانات ونقلها لمتجرك بضغطة زر دون أي تعب.' 
                : 'The perfect and fast solution for protected sites like SHEIN and Zahraah. This tool runs in your browser to extract data and move it to your store with one click.'}
            </p>

            <div className="flex flex-col md:flex-row gap-8 items-center bg-white rounded-2xl p-6 border border-indigo-50 shadow-sm">
              <div className="flex-1 space-y-4 w-full">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-black flex items-center justify-center">1</span>
                  <p className="font-bold text-gray-700">{isRTL ? 'اسحب هذا الزر وأسقطه في شريط الإشارات المرجعية (Bookmarks Bar) أعلى المتصفح:' : 'Drag this button and drop it into your Bookmarks Bar:'}</p>
                </div>
                
                <div className="pl-11 pr-11">
                  <a 
                    href={`javascript:(function(){var name=document.querySelector('h1')?.innerText||document.title;var img=document.querySelector('.product-single__photo img, .product-intro__main-img img, meta[property="og:image"]')?.getAttribute('src')||document.querySelector('meta[property="og:image"]')?.getAttribute('content');if(img&&img.startsWith('//'))img='https:'+img;var priceEl=document.querySelector('.price, .discount-price, .product-price');var price=priceEl?priceEl.innerText.replace(/[^0-9.]/g,''):'45000';var source=window.location.href;var target=window.location.origin==='${window.location.origin}'?window.location.origin:'https://extractedproject-eta.vercel.app';window.open(target+'/admin/products/bulk?autofill=true&name='+encodeURIComponent(name)+'&img='+encodeURIComponent(img)+'&price='+encodeURIComponent(price)+'&source='+encodeURIComponent(source),'_blank');})();`}
                    className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-xl font-black cursor-grab active:cursor-grabbing hover:bg-indigo-700 transition shadow-lg hover:shadow-indigo-300 w-full md:w-auto justify-center"
                    onClick={(e) => { e.preventDefault(); alert(isRTL ? 'لا تقم بالضغط هنا! قم بمسك الزر وسحبه إلى شريط الإشارات المرجعية في الأعلى.' : 'Do not click! Drag and drop this to your bookmarks bar.'); }}
                  >
                    <Zap className="w-5 h-5 text-yellow-300" />
                    {isRTL ? 'سحب المنتج لمتجري' : 'Import to My Store'}
                  </a>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-black flex items-center justify-center">2</span>
                  <p className="font-bold text-gray-700">{isRTL ? 'الآن اذهب إلى صفحة أي منتج في (شي إن) أو (زهراء).' : 'Now go to any product page on SHEIN or Zahraah.'}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-black flex items-center justify-center">3</span>
                  <p className="font-bold text-gray-700">{isRTL ? 'اضغط على الزر من شريط الإشارات، ومباشرة ستنتقل لهنا وبيانات المنتج جاهزة للحفظ!' : 'Click the button from your bookmarks bar, and you will be brought here with the data ready to save!'}</p>
                </div>
              </div>

              <div className="w-full md:w-1/3 bg-indigo-50 rounded-xl p-4 text-center border border-indigo-100">
                <p className="text-xs font-bold text-indigo-400 mb-2">{isRTL ? 'تلميح' : 'Hint'}</p>
                <p className="text-sm font-semibold text-indigo-900">
                  {isRTL ? 'إذا لم تجد شريط الإشارات، اضغط على (Ctrl + Shift + B) في الكيبورد ليظهر لك.' : 'If you don\'t see the bookmarks bar, press (Ctrl + Shift + B) on your keyboard.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== DIRECT ADD TAB ==================== */}
      {activeTab === 'direct' && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex gap-3">
            <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-black text-green-800 text-sm">{isRTL ? 'هذا الوضع يعمل دائماً مع جميع المتاجر' : 'This mode works with all stores'}</p>
              <p className="text-green-700 text-xs mt-1">{isRTL ? 'افتح شي إن أو أي موقع، انسخ اسم المنتج وسعره ورابط صورته ثم الصقه هنا.' : 'Open SHEIN or any site, copy the product name, price, and image URL then paste here.'}</p>
            </div>
          </div>

          {/* Table header */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="grid grid-cols-[1fr_100px_1.5fr_1fr_40px] gap-3 p-4 bg-gray-50 border-b text-xs font-black uppercase tracking-widest text-gray-500">
              <span>{isRTL ? 'اسم المنتج *' : 'Product Name *'}</span>
              <span>{isRTL ? 'السعر' : 'Price'}</span>
              <span>{isRTL ? 'رابط الصورة' : 'Image URL'}</span>
              <span>{isRTL ? 'رابط المصدر' : 'Source URL'}</span>
              <span></span>
            </div>

            <div className="divide-y">
              {manualProducts.map((prod) => (
                <div key={prod.id} className={`grid grid-cols-[1fr_100px_1.5fr_1fr_40px] gap-3 p-3 items-center transition-all ${prod.status === 'success' ? 'bg-green-50' : prod.status === 'error' ? 'bg-red-50' : ''}`}>
                  <input
                    type="text"
                    value={prod.name}
                    onChange={e => updateRow(prod.id, 'name', e.target.value)}
                    placeholder={isRTL ? 'مثال: فستان سهرة أحمر' : 'e.g. Red Evening Dress'}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-black font-semibold"
                    disabled={prod.status === 'loading'}
                  />
                  <input
                    type="number"
                    value={prod.price}
                    onChange={e => updateRow(prod.id, 'price', e.target.value)}
                    placeholder="45000"
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-black font-semibold"
                    disabled={prod.status === 'loading'}
                  />
                  <input
                    type="url"
                    value={prod.imageUrl}
                    onChange={e => updateRow(prod.id, 'imageUrl', e.target.value)}
                    placeholder="https://..."
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-black font-semibold"
                    disabled={prod.status === 'loading'}
                  />
                  <input
                    type="url"
                    value={prod.sourceUrl}
                    onChange={e => updateRow(prod.id, 'sourceUrl', e.target.value)}
                    placeholder="https://shein.com/..."
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-black font-semibold"
                    disabled={prod.status === 'loading'}
                  />
                  <div className="flex items-center justify-center">
                    {prod.status !== 'idle' ? statusIcon(prod.status) : (
                      <button onClick={() => removeRow(prod.id)} className="text-gray-300 hover:text-red-500 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 border-t">
              <button onClick={addRow}
                className="flex items-center gap-2 text-sm font-black text-gray-400 hover:text-black transition uppercase tracking-widest w-full justify-center py-2 rounded-xl hover:bg-gray-50">
                <Plus className="w-4 h-4" />
                {isRTL ? 'إضافة صف جديد' : 'Add Row'}
              </button>
            </div>
          </div>

          <button
            onClick={handleDirectImport}
            disabled={isDirectImporting || manualProducts.filter(p => p.name.trim()).length === 0}
            className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest hover:bg-gray-900 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl">
            {isDirectImporting ? (
              <><Loader className="w-5 h-5 animate-spin" /> {isRTL ? 'جاري الحفظ...' : 'Saving...'}</>
            ) : (
              <><Upload className="w-5 h-5" /> {isRTL ? `حفظ ${manualProducts.filter(p => p.name.trim()).length} منتجات في المتجر` : `Save ${manualProducts.filter(p => p.name.trim()).length} Products`}</>
            )}
          </button>
        </div>
      )}

      {/* ==================== URL SCRAPER TAB ==================== */}
      {activeTab === 'url' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-black text-amber-800 text-sm">{isRTL ? 'تحذير: شي إن يحظر سحب البيانات آلياً' : 'Warning: SHEIN blocks auto-scraping'}</p>
              <p className="text-amber-700 text-xs mt-1">{isRTL ? 'إذا فشل الاستيراد، استخدم وضع "الإضافة المباشرة" الذي يعمل دائماً.' : 'If import fails, switch to "Direct Add" mode — it always works.'}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <label className="block text-xs font-black uppercase tracking-widest text-gray-500">{isRTL ? 'رابط صفحة المتجر أو القسم' : 'Store or Category URL'}</label>
            <div className="flex gap-3">
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://ar.shein.com/Women-Dresses-c-2030.html"
                className="flex-1 text-sm border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-black font-semibold"
              />
              <button
                onClick={handleDiscover}
                disabled={isDiscovering || !url.trim()}
                className="px-6 py-3 bg-black text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-gray-800 transition disabled:opacity-40">
                {isDiscovering ? <Loader className="w-4 h-4 animate-spin" /> : (isRTL ? 'بحث' : 'Search')}
              </button>
            </div>
            {urlError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm font-semibold">
                {urlError}
              </div>
            )}
          </div>

          {discoveredLinks.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between">
                <span className="font-black text-sm uppercase tracking-widest">{isRTL ? `اكتُشف ${discoveredLinks.length} منتج` : `Found ${discoveredLinks.length} products`}</span>
                <div className="flex gap-3">
                  <button onClick={() => setDiscoveredLinks(l => l.map(x => ({ ...x, selected: true })))}
                    className="text-xs font-black uppercase text-gray-500 hover:text-black transition">{isRTL ? 'تحديد الكل' : 'All'}</button>
                  <button onClick={() => setDiscoveredLinks(l => l.map(x => ({ ...x, selected: false })))}
                    className="text-xs font-black uppercase text-gray-500 hover:text-black transition">{isRTL ? 'إلغاء' : 'None'}</button>
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y">
                {discoveredLinks.map(link => (
                  <div key={link.href} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer" onClick={() => toggleLink(link.href)}>
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${link.selected ? 'bg-black border-black' : 'border-gray-300'}`}>
                      {link.selected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{link.name}</p>
                      <p className="text-xs text-gray-400 truncate">{link.href}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t">
                {scrapeProgress > 0 && scrapeProgress < 100 && (
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                    <div className="bg-black h-2 rounded-full transition-all" style={{ width: `${scrapeProgress}%` }} />
                  </div>
                )}
                <button
                  onClick={handleScrape}
                  disabled={isScraping || discoveredLinks.filter(l => l.selected).length === 0}
                  className="w-full py-4 bg-black text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-gray-800 transition disabled:opacity-40 flex items-center justify-center gap-2">
                  {isScraping
                    ? <><Loader className="w-4 h-4 animate-spin" /> {isRTL ? `جاري الاستيراد... ${scrapeProgress}%` : `Importing... ${scrapeProgress}%`}</>
                    : <><Upload className="w-4 h-4" /> {isRTL ? `استيراد ${discoveredLinks.filter(l => l.selected).length} منتجات` : `Import ${discoveredLinks.filter(l => l.selected).length} Products`}</>}
                </button>
              </div>
            </div>
          )}

          {/* Log Console */}
          {logs.length > 0 && (
            <div className="bg-gray-950 text-green-400 p-5 rounded-2xl font-mono text-xs space-y-1 border border-gray-800">
              <div className="flex items-center gap-2 mb-3 text-white/40 pb-2 border-b border-white/10">
                <Terminal className="w-3 h-3" />
                <span className="uppercase tracking-widest font-black text-xs">Activity Log</span>
              </div>
              {logs.map((log, i) => (
                <p key={i} className={i === 0 ? 'text-white animate-pulse' : 'opacity-40'}>{log}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BulkImportPage;
