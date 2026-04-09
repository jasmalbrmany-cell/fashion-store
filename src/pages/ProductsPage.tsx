import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Grid, List, Search, X, Loader2 } from 'lucide-react';
import { ProductCard } from '@/components/Product';
import { productsService, categoriesService } from '@/services/api';
import { Product, Category } from '@/types';
import { useLanguage, categoryNames } from '@/context/LanguageContext';

const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 1000000 });
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);

  // Derived Filter Data
  const availableSizes = Array.from(new Set(products.flatMap(p => p.sizes.map(s => s.name)))).sort();
  const availableColors = Array.from(new Map(products.flatMap(p => p.colors.map(c => [c.hex, c.name]))).entries());

  // Fetch all products and categories once
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsData, categoriesData] = await Promise.all([
          productsService.getAll(),
          categoriesService.getAll()
        ]);
        setProducts(productsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Failed to fetch products page data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Initialize from URL params
  useEffect(() => {
    const category = searchParams.get('category') || '';
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'newest';

    setSelectedCategory(category);
    setSearchQuery(search);
    setSortBy(sort);
  }, [searchParams]);

  // Apply filters locally on the fetched products
  useEffect(() => {
    if (loading) return;

    let result = [...products];

    // Category filter
    if (selectedCategory) {
      result = result.filter(p => p.categoryId === selectedCategory);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(query) ||
        (p.description || '').toLowerCase().includes(query)
      );
    }

    // Size filter
    if (selectedSizes.length > 0) {
      result = result.filter(p => 
        p.sizes.some(s => selectedSizes.includes(s.name))
      );
    }

    // Color filter
    if (selectedColors.length > 0) {
      result = result.filter(p => 
        p.colors.some(c => selectedColors.includes(c.hex))
      );
    }

    // Price filter
    result = result.filter(p =>
      p.price >= priceRange.min && p.price <= priceRange.max
    );

    // Sort
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

    setFilteredProducts(result);
  }, [selectedCategory, searchQuery, sortBy, priceRange, selectedSizes, selectedColors, products, loading]);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const params = new URLSearchParams(searchParams);
    if (categoryId) {
      params.set('category', categoryId);
    } else {
      params.delete('category');
    }
    setSearchParams(params);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchQuery) {
      params.set('search', searchQuery);
    } else {
      params.delete('search');
    }
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSearchQuery('');
    setSortBy('newest');
    setPriceRange({ min: 0, max: 1000000 });
    setSelectedSizes([]);
    setSelectedColors([]);
    setSearchParams({});
  };

  const selectedCategoryName = selectedCategory
    ? (categoryNames[selectedCategory]?.[language] || categories.find(c => c.id === selectedCategory)?.name || t.allProducts)
    : t.allProducts;

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {selectedCategory ? selectedCategoryName : t.allProducts}
          </h1>
          <p className="text-gray-500">
            {filteredProducts.length} {t.productCount}
          </p>
        </div>

        {/* Search & Controls */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <button type="submit" className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary-600">
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </form>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              <option value="newest">{t.sortNewest}</option>
              <option value="price-low">{t.sortPriceLow}</option>
              <option value="price-high">{t.sortPriceHigh}</option>
              <option value="name">{t.sortName}</option>
            </select>

            {/* View Mode */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Toggle - Mobile */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white"
            >
              <Filter className="w-5 h-5" />
              <span>{t.filters}</span>
            </button>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-gray-900">{t.filters}</h3>
                {(selectedCategory || searchQuery || selectedSizes.length > 0 || selectedColors.length > 0) && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {t.clearAll}
                  </button>
                )}
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3 border-b pb-2">{t.categories}</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => handleCategoryChange('')}
                    className={`w-full text-right py-1.5 px-3 rounded-lg transition-colors ${
                      !selectedCategory ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {t.allProducts}
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryChange(category.id)}
                      className={`w-full text-right py-1.5 px-3 rounded-lg transition-colors ${
                        selectedCategory === category.id ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {categoryNames[category.id]?.[language] || category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3 border-b pb-2">{t.priceRange}</h4>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder={t.minPrice}
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-black"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    placeholder={t.maxPrice}
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>

              {/* Sizes */}
              {availableSizes.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3 border-b pb-2">{t.availableSizes}</h4>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map(size => (
                      <button
                        key={size}
                        onClick={() => {
                          setSelectedSizes(prev => 
                            prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
                          );
                        }}
                        className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                          selectedSizes.includes(size) 
                            ? 'bg-black text-white border-black' 
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Colors */}
              {availableColors.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3 border-b pb-2">{t.availableColors}</h4>
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
                        className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center p-0.5 ${
                          selectedColors.includes(hex) ? 'border-black scale-110' : 'border-transparent hover:border-gray-300'
                        }`}
                      >
                        <div 
                          className="w-full h-full rounded-full border border-gray-200" 
                          style={{ backgroundColor: hex }}
                        ></div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {filteredProducts.length > 0 ? (
              <div className={
                viewMode === 'grid'
                  ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'
                  : 'space-y-4'
              }>
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Search className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t.noProducts}</h3>
                <p className="text-gray-500 mb-8">{t.tryDiffSearch}</p>
                <button
                  onClick={clearFilters}
                  className="px-10 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition shadow-lg"
                >
                  {t.clearAll}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Modal */}
      {showFilters && (
        <div className="fixed inset-0 bg-black/50 z-50 md:hidden">
          <div className="bg-white h-full w-80 overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{language === 'ar' ? 'الفلاتر' : 'Filters'}</h3>
              <button onClick={() => setShowFilters(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4">
              {/* Categories */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3 border-b pb-2">{t.categories}</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => { handleCategoryChange(''); setShowFilters(false); }}
                    className={`w-full text-right py-2.5 px-4 rounded-xl transition-colors ${!selectedCategory ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    {t.allProducts}
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => { handleCategoryChange(category.id); setShowFilters(false); }}
                      className={`w-full text-right py-2.5 px-4 rounded-xl transition-colors ${selectedCategory === category.id ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                      {categoryNames[category.id]?.[language] || category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-8">
                <h4 className="font-medium text-gray-900 mb-3 border-b pb-2">{t.priceRange}</h4>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder={t.minPrice}
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-1 focus:ring-black"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    placeholder={t.maxPrice}
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>

              {/* Sizes Mobile */}
              {availableSizes.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3 border-b pb-2">{t.availableSizes}</h4>
                  <div className="flex flex-wrap gap-2 text-right" dir="rtl">
                    {availableSizes.map(size => (
                      <button
                        key={size}
                        onClick={() => {
                          setSelectedSizes(prev => 
                            prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
                          );
                        }}
                        className={`px-4 py-2 rounded-xl border text-base font-medium transition-all ${
                          selectedSizes.includes(size) 
                            ? 'bg-black text-white border-black' 
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Colors Mobile */}
              {availableColors.length > 0 && (
                <div className="mb-8">
                  <h4 className="font-medium text-gray-900 mb-3 border-b pb-2">{t.availableColors}</h4>
                  <div className="flex flex-wrap gap-3">
                    {availableColors.map(([hex, name]) => (
                      <button
                        key={hex}
                        title={name}
                        onClick={() => {
                          setSelectedColors(prev => 
                            prev.includes(hex) ? prev.filter(c => c !== hex) : [...prev, hex]
                          );
                        }}
                        className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center p-0.5 ${
                          selectedColors.includes(hex) ? 'border-black scale-110' : 'border-transparent hover:border-gray-300'
                        }`}
                      >
                        <div 
                          className="w-full h-full rounded-full border border-gray-200" 
                          style={{ backgroundColor: hex }}
                        ></div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowFilters(false)}
                className="w-full py-4 bg-black text-white rounded-xl font-bold shadow-lg"
              >
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
