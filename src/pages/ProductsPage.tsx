import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Grid, List, Search, X, Loader2 } from 'lucide-react';
import { ProductCard } from '@/components/Product';
import { productsService, categoriesService, storeSettingsService } from '@/services/api';
import { Product, Category, StoreSettings } from '@/types';
import { useLanguage, categoryNames, translateCategory } from '@/context/LanguageContext';
import { ProductGridSkeleton } from '@/components/Common/Skeleton';

const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 1000000 });
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [displayCount, setDisplayCount] = useState(12);
  const loadMoreRef = React.useRef<HTMLDivElement>(null);

  const availableSizes = useMemo(() => 
    Array.from(new Set(products.flatMap(p => p.sizes.map(s => s.name)))).sort()
  , [products]);

  const availableColors = useMemo(() => 
    Array.from(new Map(products.flatMap(p => p.colors.map(c => [c.hex, c.name]))).entries())
  , [products]);

  useEffect(() => {
    document.title = isRTL ? 'المتجر - فاشن هوب' : 'Shop - Fashion Hub';
  }, [isRTL]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsData, categoriesData, settingsData] = await Promise.all([
          productsService.getAll(),
          categoriesService.getAll(),
          storeSettingsService.get()
        ]);
        setProducts(productsData);
        setCategories(categoriesData);
        setSettings(settingsData);
      } catch (error) {
        console.error('Failed to fetch products page data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const category = searchParams.get('category') || '';
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'newest';

    setSelectedCategory(category);
    setSearchQuery(search);
    setSortBy(sort);
  }, [searchParams]);

  // Get all sub-category IDs for a given categoryId (including itself)
  const getCategoryIds = (catId: string): string[] => {
    const children = categories.filter(c => c.parentId === catId);
    return [catId, ...children.map(c => c.id)];
  };

  const filteredProducts = useMemo(() => {
    if (loading) return [];

    let result = [...products];

    if (selectedCategory) {
      // Include products from this category AND all its sub-categories
      const validIds = new Set(getCategoryIds(selectedCategory));
      result = result.filter(p => validIds.has(p.categoryId));
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(query) ||
        (p.description || '').toLowerCase().includes(query)
      );
    }

    if (selectedSizes.length > 0) {
      result = result.filter(p => p.sizes.some(s => selectedSizes.includes(s.name)));
    }

    if (selectedColors.length > 0) {
      result = result.filter(p => p.colors.some(c => selectedColors.includes(c.hex)));
    }

    result = result.filter(p => p.price >= priceRange.min && p.price <= priceRange.max);

    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, searchQuery, sortBy, priceRange, selectedSizes, selectedColors, products, loading]);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setDisplayCount(12);
    const params = new URLSearchParams(searchParams);
    if (categoryId) params.set('category', categoryId);
    else params.delete('category');
    setSearchParams(params);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setDisplayCount((prev) => prev + 12);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [filteredProducts.length, displayCount]);

  const clearFilters = () => {
    setSelectedCategory('');
    setSearchQuery('');
    setSortBy('newest');
    setPriceRange({ min: 0, max: 1000000 });
    setSelectedSizes([]);
    setSelectedColors([]);
    setDisplayCount(12);
    setSearchParams({});
  };

  const isAr = language === 'ar';

  if ((loading && products.length === 0) || settings?.isMaintenanceMode) {
    return (
      <div className="bg-gray-50 dark:bg-black min-h-screen py-8 flex flex-col items-center justify-center text-center p-8">
        <div className="max-w-md w-full space-y-6">
           <Loader2 className="w-12 h-12 text-black animate-spin mx-auto mb-4" />
           <h2 className="text-2xl font-black text-gray-900 dark:text-white">
             {settings?.isMaintenanceMode 
               ? (isAr ? 'جاري تحديث المنتجات...' : 'Updating products...') 
               : (isAr ? 'جاري التحميل...' : 'Loading...')}
           </h2>
           <p className="text-gray-500 font-bold">
             {settings?.isMaintenanceMode 
               ? (isAr ? 'نقوم حالياً بإضافة التشكيلة الجديدة وتحديث الأسعار. ترقبوا المفاجآت!' : 'We are currently adding a new collection and updating prices. Stay tuned!') 
               : (isAr ? 'يرجى الانتظار...' : 'Please wait...')}
           </p>
           {!settings?.isMaintenanceMode && <ProductGridSkeleton />}
        </div>
      </div>
    );
  }

  const selectedCategoryName = selectedCategory
    ? (translateCategory(selectedCategory, categories.find(c => c.id === selectedCategory)?.name || '', language))
    : t.allProducts;

  return (
    <div className="bg-gray-50 dark:bg-black min-h-screen py-8 transition-colors duration-500" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tighter">
            {selectedCategory ? selectedCategoryName : t.allProducts}
          </h1>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">
            {filteredProducts.length} {t.productCount}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm p-4 mb-8 border border-gray-100 dark:border-gray-800 transition-colors">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-5 py-3 pr-12 bg-gray-50 dark:bg-gray-800 border-0 rounded-2xl focus:ring-2 focus:ring-black dark:focus:ring-white transition-all font-bold outline-none dark:text-white"
                />
                <Search className={`absolute ${language === 'ar' ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5`} />
              </div>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-0 rounded-2xl focus:ring-2 focus:ring-black dark:focus:ring-white outline-none font-bold dark:text-white"
            >
              <option value="newest">{t.sortNewest}</option>
              <option value="price-low">{t.sortPriceLow}</option>
              <option value="price-high">{t.sortPriceHigh}</option>
              <option value="name">{t.sortName}</option>
            </select>

            <div className="flex bg-gray-50 dark:bg-gray-800 rounded-2xl overflow-hidden p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-black'}`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-black'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-2xl font-bold shadow-xl active:scale-95 transition-all"
            >
              <Filter className="w-5 h-5" />
              <span>{t.filters}</span>
            </button>
          </div>
        </div>

        <div className="flex gap-8">
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 sticky top-24 transition-colors">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-xs">{t.filters}</h3>
              </div>

              <div className="mb-8">
                <h4 className="font-black text-[10px] text-gray-400 dark:text-gray-500 mb-4 uppercase tracking-[0.2em]">{t.categories}</h4>
                <div className="space-y-1">
                  <button
                    onClick={() => handleCategoryChange('')}
                    className={`w-full text-start py-2.5 px-4 rounded-xl transition-all font-bold text-sm ${
                      !selectedCategory ? 'bg-black text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {t.allProducts}
                  </button>
                  {categories.filter(c => !c.parentId).map((parent) => {
                    const children = categories.filter(c => c.parentId === parent.id);
                    const isParentSelected = selectedCategory === parent.id;
                    const isChildSelected = children.some(c => c.id === selectedCategory);
                    const isExpanded = isParentSelected || isChildSelected;
                    return (
                      <div key={parent.id}>
                        <button
                          onClick={() => handleCategoryChange(parent.id)}
                          className={`w-full text-start py-2.5 px-4 rounded-xl transition-all font-bold text-sm flex items-center justify-between gap-2 ${
                            isParentSelected ? 'bg-black text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        >
                          <span>{translateCategory(parent.id, parent.name, language)}</span>
                          {children.length > 0 && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${isParentSelected ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
                              {children.length}
                            </span>
                          )}
                        </button>
                        {children.length > 0 && isExpanded && (
                          <div className={`mt-1 mb-1 ${language === 'ar' ? 'mr-4 border-r-2' : 'ml-4 border-l-2'} border-gray-100 dark:border-gray-800 ${language === 'ar' ? 'pr-2' : 'pl-2'} space-y-1`}>
                            {children.map(child => (
                              <button
                                key={child.id}
                                onClick={() => handleCategoryChange(child.id)}
                                className={`w-full text-start py-2 px-3 rounded-lg transition-all text-sm ${
                                  selectedCategory === child.id ? 'bg-black text-white font-bold shadow' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold'
                                }`}
                              >
                                {translateCategory(child.id, child.name, language)}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {/* Flat categories if no hierarchy */}
                  {categories.filter(c => !c.parentId).length === 0 && categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryChange(category.id)}
                      className={`w-full text-start py-2.5 px-4 rounded-xl transition-all font-bold text-sm ${
                        selectedCategory === category.id ? 'bg-black text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      {translateCategory(category.id, category.name, language)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <h4 className="font-black text-[10px] text-gray-400 dark:text-gray-500 mb-4 uppercase tracking-[0.2em]">{t.priceRange}</h4>
                <div className="space-y-3">
                  <input
                    type="number"
                    placeholder={t.minPrice}
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-0 rounded-xl text-sm font-bold focus:ring-2 focus:ring-black dark:focus:ring-white outline-none dark:text-white"
                  />
                  <input
                    type="number"
                    placeholder={t.maxPrice}
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-0 rounded-xl text-sm font-bold focus:ring-2 focus:ring-black dark:focus:ring-white outline-none dark:text-white"
                  />
                </div>
              </div>

              {availableSizes.length > 0 && (
                <div className="mb-8">
                  <h4 className="font-black text-[10px] text-gray-400 dark:text-gray-500 mb-4 uppercase tracking-[0.2em]">{t.availableSizes}</h4>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map(size => (
                      <button
                        key={size}
                        onClick={() => {
                          setSelectedSizes(prev => 
                            prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
                          );
                        }}
                        className={`px-3 py-1.5 rounded-lg border-2 text-[10px] font-black transition-all ${
                          selectedSizes.includes(size) 
                            ? 'bg-black text-white border-black' 
                            : 'bg-white dark:bg-gray-800 text-gray-400 border-gray-100 dark:border-gray-700 hover:border-black'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {availableColors.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-black text-[10px] text-gray-400 dark:text-gray-500 mb-4 uppercase tracking-[0.2em]">{t.availableColors}</h4>
                  <div className="flex flex-wrap gap-2">
                    {availableColors.map(([hex, name]) => (
                      <button
                        key={hex}
                        title={name}
                        onClick={() => {
                          setSelectedColors(prev => 
                            prev.includes(hex) ? prev.filter(c => c !== hex) : [...prev, hex]
                          );
                        }}
                        className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center p-0.5 ${
                          selectedColors.includes(hex) ? 'border-black scale-110' : 'border-transparent hover:scale-105'
                        }`}
                      >
                        <div className="w-full h-full rounded-full border border-gray-100 shadow-inner" style={{ backgroundColor: hex }}></div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          <div className="flex-1">
            {filteredProducts.length > 0 ? (
              <>
                <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
                  {filteredProducts.slice(0, displayCount).map((product) => <ProductCard key={product.id} product={product} />)}
                </div>
                {displayCount < filteredProducts.length && (
                  <div ref={loadMoreRef} className="py-12 flex justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-20 text-center border border-dashed border-gray-200 dark:border-gray-800">
                <Search className="w-16 h-16 text-gray-200 dark:text-gray-700 mx-auto mb-6" />
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">{t.noProducts}</h3>
                <p className="text-gray-500 dark:text-gray-400 font-bold mb-8 uppercase tracking-widest text-[10px]">{t.tryDiffSearch}</p>
                <button onClick={clearFilters} className="px-10 py-4 bg-black text-white rounded-2xl font-black shadow-xl hover:scale-105 transition-all outline-none">
                  {t.clearAll}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden animate-in fade-in duration-300">
          <div className="absolute inset-y-0 end-0 w-80 bg-white dark:bg-black h-full shadow-2xl overflow-y-auto">
            <div className="p-6 border-b dark:border-gray-800 flex items-center justify-between">
              <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-widest text-xs">{t.filters}</h3>
              <button onClick={() => setShowFilters(false)} className="p-2 bg-gray-50 dark:bg-gray-900 rounded-xl">
                <X className="w-5 h-5 dark:text-white" />
              </button>
            </div>
            <div className="p-6 space-y-8">
              <div>
                <h4 className="font-black text-[10px] text-gray-400 mb-4 uppercase tracking-[0.2em]">{t.categories}</h4>
                <div className="grid grid-cols-1 gap-2">
                   <button onClick={() => { handleCategoryChange(''); setShowFilters(false); }} className={`py-3 px-4 rounded-xl text-start font-bold text-sm ${!selectedCategory ? 'bg-black text-white' : 'bg-gray-50 dark:bg-gray-900 text-gray-500'}`}>{t.allProducts}</button>
                   {categories.map(c => <button key={c.id} onClick={() => { handleCategoryChange(c.id); setShowFilters(false); }} className={`py-3 px-4 rounded-xl text-start font-bold text-sm ${selectedCategory === c.id ? 'bg-black text-white' : 'bg-gray-50 dark:bg-gray-900 text-gray-500'}`}>{translateCategory(c.id, c.name, language)}</button>)}
                </div>
              </div>

              <div>
                <h4 className="font-black text-[10px] text-gray-400 mb-4 uppercase tracking-[0.2em]">{t.priceRange}</h4>
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" placeholder={t.minPrice} value={priceRange.min} onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-xl outline-none font-bold text-sm dark:text-white" />
                  <input type="number" placeholder={t.maxPrice} value={priceRange.max} onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-xl outline-none font-bold text-sm dark:text-white" />
                </div>
              </div>

              <button onClick={() => setShowFilters(false)} className="w-full py-5 bg-black text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl">
                {t.applyFilters}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
