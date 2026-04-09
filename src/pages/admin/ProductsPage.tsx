import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Filter,
  MoreVertical,
  ExternalLink,
  Image as ImageIcon,
  Upload,
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  X
} from 'lucide-react';
import { productsService, categoriesService, hasValidCache, getCachedSync } from '@/services/api';
import { Product, Category } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { Skeleton, TableSkeleton } from '@/components/Common/Skeleton';

const AdminProductsPage: React.FC = () => {
  const { t, language, isRTL } = useLanguage();
  const [products, setProducts] = useState<Product[]>(getCachedSync<Product[]>('products_admin_all') || []);
  const [categories, setCategories] = useState<Category[]>(getCachedSync<Category[]>('categories_all') || []);
  const [isLoading, setIsLoading] = useState(!hasValidCache('products_admin_all') || !hasValidCache('categories_all'));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    if (!hasValidCache('products_admin_all')) {
        setIsLoading(true);
    }
    try {
      const [prods, cats] = await Promise.all([
        productsService.getAllAdmin(),
        categoriesService.getAll()
      ]);
      setProducts(prods || []);
      setCategories(cats || []);
    } catch (err) {
      console.error('Failed to load data', err);
      setProducts([]);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredProducts.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const bulkToggleVisibility = async (visible: boolean) => {
    if (selectedIds.length === 0) return;
    setIsBulkLoading(true);
    try {
      await Promise.all(selectedIds.map(id => productsService.update(id, { isVisible: visible })));
      setProducts(prev => prev.map(p => selectedIds.includes(p.id) ? { ...p, isVisible: visible } : p));
      showToast('success', isRTL ? `تم تحديث ${selectedIds.length} منتجات` : `Updated ${selectedIds.length} products`);
      setSelectedIds([]);
    } catch (err) {
      showToast('error', 'Error in bulk update');
    } finally {
      setIsBulkLoading(false);
    }
  };

  const bulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(isRTL ? `هل أنت متأكد من حذف ${selectedIds.length} منتجات؟` : `Delete ${selectedIds.length} items?`)) {
      setIsBulkLoading(true);
      try {
        await Promise.all(selectedIds.map(id => productsService.delete(id)));
        setProducts(prev => prev.filter(p => !selectedIds.includes(p.id)));
        showToast('success', isRTL ? 'تم الحذف بنجاح' : 'Deleted successfully');
        setSelectedIds([]);
      } catch (err) {
        showToast('error', 'Error in bulk delete');
      } finally {
        setIsBulkLoading(false);
      }
    }
  };

  const filteredProducts = products.filter(product => {
    const nameStr = product.name || '';
    const matchesSearch = nameStr.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleVisibility = async (product: Product) => {
    try {
        const updated = await productsService.toggleVisibility(product.id);
        if (updated) {
            setProducts(prev => prev.map(p => p.id === product.id ? updated : p));
            showToast('success', updated.isVisible ? (isRTL ? 'المنتج الآن مرئي للجميع' : 'Product is now visible') : (isRTL ? 'تم إخفاء المنتج بنجاح' : 'Product is now hidden'));
        }
    } catch (err) {
        console.error('Failed to toggle visibility', err);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (window.confirm(t.confirmDeleteProduct)) {
      try {
        const success = await productsService.delete(productId);
        if (success) {
            setProducts(prev => prev.filter(p => p.id !== productId));
            showToast('success', isRTL ? 'تم حذف المنتج بنجاح' : 'Product deleted successfully');
        }
      } catch (err) {
        console.error('Failed to delete product', err);
      }
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Skeleton className="h-10 w-64 rounded-2xl" />
          <Skeleton className="h-12 w-40 rounded-2xl" />
        </div>
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-12 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-8 py-4 rounded-[1.5rem] shadow-2xl text-white font-black uppercase tracking-widest text-xs animate-in slide-in-from-top-12 ${
          toast.type === 'success' ? 'bg-black border border-white/10' : 'bg-red-600'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-white" />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900">{t.manageProducts}</h1>
          <p className="text-gray-500 font-bold">{products.length} {t.availableProducts}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadData}
            className="p-3 bg-white border border-gray-100 rounded-2xl hover:border-black transition-all"
            title={t.refresh}
          >
            <RefreshCw className={`w-5 h-5 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/admin/products/import"
            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-100 rounded-2xl hover:border-black transition-all font-black text-sm"
          >
            <Upload className="w-5 h-5" />
            {t.importFromUrl}
          </Link>
          <Link
            to="/admin/products/add"
            className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-2xl hover:bg-gray-800 transition-all font-black text-sm shadow-xl shadow-gray-200"
          >
            <Plus className="w-5 h-5" />
            {t.addProduct}
          </Link>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white rounded-3xl shadow-sm border p-4 md:p-6 sticky top-20 z-10 backdrop-blur-md bg-white/90">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5`} />
            <input
              type="text"
              placeholder={t.searchByProductName}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full ${isRTL ? 'pr-12' : 'pl-12'} py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black focus:bg-white transition-all outline-none font-bold`}
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black outline-none font-bold appearance-none min-w-[200px]"
          >
            <option value="">{t.allCategories}</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-black text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-10 border border-white/10 min-w-[300px] md:min-w-[500px]">
          <div className="flex items-center gap-2 border-e border-white/20 pe-6">
            <span className="bg-white text-black w-7 h-7 rounded-full flex items-center justify-center font-black text-sm">
              {selectedIds.length}
            </span>
            <span className="text-sm font-bold uppercase tracking-widest">{isRTL ? 'تم تحديدها' : 'Selected'}</span>
          </div>

          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => bulkToggleVisibility(true)}
              disabled={isBulkLoading}
              className="flex items-center gap-2 hover:text-green-400 transition-colors font-black text-sm uppercase tracking-widest disabled:opacity-50"
            >
              <Eye className="w-5 h-5" />
              <span className="hidden md:inline">{t.show}</span>
            </button>
            <button
              onClick={() => bulkToggleVisibility(false)}
              disabled={isBulkLoading}
              className="flex items-center gap-2 hover:text-orange-400 transition-colors font-black text-sm uppercase tracking-widest disabled:opacity-50"
            >
              <EyeOff className="w-5 h-5" />
              <span className="hidden md:inline">{t.hidden}</span>
            </button>
            <button 
              onClick={bulkDelete}
              disabled={isBulkLoading}
              className="flex items-center gap-2 hover:text-red-400 Transition-colors font-black text-sm uppercase tracking-widest pe-4 disabled:opacity-50"
            >
              <Trash2 className="w-5 h-5" />
              <span className="hidden md:inline">{t.delete}</span>
            </button>
          </div>

          <button
            onClick={() => setSelectedIds([])}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          {isBulkLoading && (
            <div className="absolute inset-0 bg-black/60 rounded-3xl flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          )}
        </div>
      )}

      {/* Table Interface */}
      <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-5 text-start w-12">
                   <div className="flex items-center">
                     <input
                       type="checkbox"
                       checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0}
                       onChange={handleSelectAll}
                       className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                     />
                   </div>
                </th>
                <th className="px-6 py-5 text-start text-xs font-black text-gray-400 uppercase tracking-widest">{t.productName}</th>
                <th className="px-6 py-5 text-start text-xs font-black text-gray-400 uppercase tracking-widest">{t.productCategory}</th>
                <th className="px-6 py-5 text-start text-xs font-black text-gray-400 uppercase tracking-widest">{t.productPrice}</th>
                <th className="px-6 py-5 text-start text-xs font-black text-gray-400 uppercase tracking-widest">{t.stockLabel}</th>
                <th className="px-6 py-5 text-start text-xs font-black text-gray-400 uppercase tracking-widest">{t.visibilityStatus}</th>
                <th className="px-6 py-5 text-center text-xs font-black text-gray-400 uppercase tracking-widest">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((product) => {
                const category = categories.find(c => c.id === product.categoryId);
                return (
                  <tr key={product.id} className={`hover:bg-gray-50/50 transition-colors ${selectedIds.includes(product.id) ? 'bg-black/[0.02]' : ''}`}>
                    <td className="px-6 py-4">
                       <input
                         type="checkbox"
                         checked={selectedIds.includes(product.id)}
                         onChange={() => handleSelectOne(product.id)}
                         className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                       />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-100 shadow-sm flex-shrink-0 bg-gray-50">
                          {product.images?.[0]?.url ? (
                              <img
                                src={product.images[0].url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                          ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <ImageIcon className="w-6 h-6" />
                              </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-gray-900 truncate max-w-[200px]">{product.name}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{t.addedAt} {formatDate(product.createdAt)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-gray-600 px-3 py-1 bg-gray-100 rounded-lg">{category?.name || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-black text-black">{formatPrice(product.price)} {t.rial}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-black ${
                        product.stock > 10 ? 'text-green-600' :
                        product.stock > 0 ? 'text-orange-600' : 'text-red-600'
                      }`}>
                        {product.stock} {t.stockUnits}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        product.isVisible
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {product.isVisible ? t.visible : t.hidden}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                         <Link
                          to={`/admin/products/edit/${product.id}`}
                          className="p-2 hover:bg-black hover:text-white rounded-xl transition-all border border-gray-100"
                          title={t.edit}
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => toggleVisibility(product)}
                          className={`p-2 rounded-xl transition-all border border-gray-100 ${product.isVisible ? 'hover:bg-orange-50 text-gray-400 hover:text-orange-600' : 'hover:bg-green-50 text-gray-400 hover:text-green-600'}`}
                          title={product.isVisible ? t.hidden : t.visible}
                        >
                          {product.isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-xl transition-all border border-gray-100"
                          title={t.delete}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="p-20 text-center space-y-4">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-gray-400 font-bold">{isRTL ? 'لا توجد منتجات تطابق بحثك' : 'No products found matching your criteria'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProductsPage;
