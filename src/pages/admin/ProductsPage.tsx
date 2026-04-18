import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Search, Edit, Trash2, Eye, EyeOff, MoreVertical,
  ExternalLink, Image as ImageIcon, Upload, Loader2, AlertCircle,
  RefreshCw, CheckCircle2, X, Percent, TrendingDown, TrendingUp, Check, Save
} from 'lucide-react';
import { productsService, categoriesService, hasValidCache, getCachedSync } from '@/services/api';
import { Product, Category } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { Skeleton, TableSkeleton } from '@/components/Common/Skeleton';
import { useNotificationContext } from '@/context/NotificationContext';

const AdminProductsPage: React.FC = () => {
  const { t, language, isRTL } = useLanguage();
  const { showSuccess, showError } = useNotificationContext();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  
  // Inline Edit States
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');
  const [editStock, setEditStock] = useState<string>('');
  const [isSavingInline, setIsSavingInline] = useState(false);

  // Pricing Modal States
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [pricingAction, setPricingAction] = useState<'discount' | 'increase'>('discount');
  const [pricingPercentage, setPricingPercentage] = useState<string>('');

  const loadData = async () => {
    setIsLoading(true);
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
      showSuccess('✅ ' + (isRTL ? `تم تحديث ${selectedIds.length} منتج` : `Updated ${selectedIds.length} products`));
      setSelectedIds([]);
    } catch (err: any) {
      console.error('❌ Bulk visibility error:', err);
      const errorMsg = err?.message || (isRTL ? 'فشل التحديث - تحقق من الاتصال' : 'Update Failed - Check your connection');
      showError('❌ ' + errorMsg);
    } finally {
      setIsBulkLoading(false);
    }
  };

  const bulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(t.deleteItemsConfirm.replace('{count}', String(selectedIds.length)))) {
      setIsBulkLoading(true);
      try {
        await Promise.all(selectedIds.map(id => productsService.delete(id)));
        setProducts(prev => prev.filter(p => !selectedIds.includes(p.id)));
        showSuccess('✅ ' + (isRTL ? `تم حذف ${selectedIds.length} منتج` : `Deleted ${selectedIds.length} products`));
        setSelectedIds([]);
      } catch (err: any) {
        console.error('❌ Bulk delete error:', err);
        const errorMsg = err?.message || (isRTL ? 'فشل الحذف - تحقق من الاتصال' : 'Delete Failed - Check your connection');
        showError('❌ ' + errorMsg);
      } finally {
        setIsBulkLoading(false);
      }
    }
  };

  const applyBulkPricing = async () => {
    const percentage = Number(pricingPercentage);
    if (selectedIds.length === 0 || isNaN(percentage) || percentage <= 0) return;
    
    setIsPricingModalOpen(false);
    setIsBulkLoading(true);
    
    try {
      const updates = selectedIds.map(id => {
        const product = products.find(p => p.id === id);
        if (!product) return null;
        
        const multiplier = pricingAction === 'discount' 
          ? (1 - percentage / 100) 
          : (1 + percentage / 100);
        
        const newPrice = Math.round(product.price * multiplier);
        
        const updateData: Partial<Product> = { price: newPrice };
        if (pricingAction === 'discount') {
          updateData.compareAtPrice = product.price;
        } else {
          updateData.compareAtPrice = 0;
        }
        
        return { id, updateData, newPrice };
      }).filter(Boolean);

      await Promise.all(updates.map(u => productsService.update(u!.id, u!.updateData)));
      
      setProducts(prev => prev.map(p => {
         const up = updates.find(u => u!.id === p.id);
         if (up) return { ...p, ...up!.updateData };
         return p;
      }));
      
      showSuccess('✅ ' + (isRTL ? `تم تحديث أسعار ${selectedIds.length} منتج` : `Updated prices for ${selectedIds.length} products`));
      setSelectedIds([]);
      setPricingPercentage('');
    } catch (err: any) {
      console.error('❌ Pricing error:', err);
      const errorMsg = err?.message || (isRTL ? 'خطأ في تحديث الأسعار - تحقق من الاتصال' : 'Error updating prices - Check your connection');
      showError('❌ ' + errorMsg);
    } finally {
      setIsBulkLoading(false);
    }
  };

  const toggleVisibility = async (product: Product) => {
    try {
        setIsBulkLoading(true);
        const updated = await productsService.toggleVisibility(product.id);
        if (updated) {
            setProducts(prev => prev.map(p => p.id === product.id ? updated : p));
            showSuccess('✅ ' + (updated.isVisible ? (isRTL ? 'المنتج مرئي الآن' : 'Product is now visible') : (isRTL ? 'المنتج مخفي الآن' : 'Product is now hidden')));
        } else {
            showError('❌ ' + (isRTL ? 'فشل تحديث المنتج - حاول مرة أخرى' : 'Failed to update product'));
        }
    } catch (err: any) {
        console.error('❌ Failed to toggle visibility:', err);
        const errorMsg = err?.message || (isRTL ? 'فشل التحديث - تحقق من الاتصال' : 'Update Failed - Check your connection');
        showError('❌ ' + errorMsg);
    } finally {
        setIsBulkLoading(false);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (window.confirm(t.confirmDeleteProduct)) {
      try {
        setIsBulkLoading(true);
        const success = await productsService.delete(productId);
        if (success) {
            setProducts(prev => prev.filter(p => p.id !== productId));
            showSuccess('✅ ' + (isRTL ? 'تم حذف المنتج' : 'Product Deleted'));
        } else {
            showError('❌ ' + (isRTL ? 'فشل حذف المنتج - حاول مرة أخرى' : 'Failed to delete product'));
        }
      } catch (err: any) {
        console.error('❌ Failed to delete product:', err);
        const errorMsg = err?.message || (isRTL ? 'فشل الحذف - تحقق من الاتصال' : 'Delete Failed - Check your connection');
        showError('❌ ' + errorMsg);
      } finally {
        setIsBulkLoading(false);
      }
    }
  };

  const startInlineEdit = (product: Product) => {
    setEditingRow(product.id);
    setEditPrice(product.price.toString());
    setEditStock(product.stock.toString());
  };

  const saveInlineEdit = async (productId: string) => {
    setIsSavingInline(true);
    try {
      const p = parseFloat(editPrice);
      const s = parseInt(editStock, 10);
      if (isNaN(p) || isNaN(s)) throw new Error(isRTL ? 'قيم غير صالحة' : 'Invalid values');

      const updated = await productsService.update(productId, { price: p, stock: s });
      if (updated) {
        setProducts(prev => prev.map(prod => prod.id === productId ? { ...prod, price: p, stock: s } : prod));
        showSuccess('✅ ' + (isRTL ? 'تم الحفظ بنجاح' : 'Saved Successfully'));
      } else {
        showError('❌ ' + (isRTL ? 'فشل الحفظ - حاول مرة أخرى' : 'Save Failed'));
      }
    } catch (err: any) {
      console.error('❌ Inline edit error:', err);
      const errorMsg = err?.message || (isRTL ? 'قيم غير صالحة - تحقق من الاتصال' : 'Invalid values - Check your connection');
      showError('❌ ' + errorMsg);
    } finally {
      setIsSavingInline(false);
      setEditingRow(null);
    }
  };

  const filteredProducts = products.filter(product => {
    const nameStr = product.name || '';
    const matchesSearch = nameStr.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatPrice = (price: number) => price.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US');
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900">{t.manageProducts}</h1>
          <p className="text-gray-500 font-bold">{products.length} {t.availableProducts}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={loadData}
            className="p-3 bg-white border border-gray-100 rounded-2xl hover:border-black transition-all"
            title={t.refresh}
          >
            <RefreshCw className={`w-5 h-5 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
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
            <span className="text-sm font-bold uppercase tracking-widest">{t.permissionsLabel}</span>
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
              onClick={() => setIsPricingModalOpen(true)}
              disabled={isBulkLoading}
              className="flex items-center gap-2 hover:text-blue-400 transition-colors font-black text-sm uppercase tracking-widest disabled:opacity-50"
            >
              <Percent className="w-5 h-5" />
              <span className="hidden md:inline">{isRTL ? 'رسوم' : 'Pricing'}</span>
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
                <th className="px-6 py-5 text-center text-xs font-black text-gray-400 uppercase tracking-widest">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((product) => {
                const category = categories.find(c => c.id === product.categoryId);
                const isEditing = editingRow === product.id;

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
                              <img src={product.images[0].url} alt="" className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <ImageIcon className="w-6 h-6" />
                              </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className={`font-black text-gray-900 truncate max-w-[200px] ${!product.isVisible && 'opacity-50 line-through text-gray-400'}`}>
                            {product.name}
                          </p>
                          <div className="flex gap-2 items-center mt-1">
                            <span className={`px-2 py-0.5 rounded flex items-center gap-1 text-[10px] font-black uppercase ${
                              product.isVisible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${product.isVisible ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                              {product.isVisible ? t.visible : t.hidden}
                            </span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                              {t.addedAt} {formatDate(product.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {category ? (
                        <div className="flex flex-col">
                          {category.parentId && (
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
                              {categories.find(c => c.id === category.parentId)?.name}
                            </span>
                          )}
                          <span className="text-sm font-black text-gray-700">
                            {category.parentId ? '↳ ' : ''}{category.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    
                    {/* Inline Edit UI: Price */}
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                           <input 
                             type="number"
                             value={editPrice}
                             onChange={e => setEditPrice(e.target.value)}
                             className="w-24 px-3 py-2 bg-white border-2 border-black rounded-xl font-black text-sm outline-none"
                           />
                           <span className="text-xs font-bold text-gray-400">{t.rial}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          {product.compareAtPrice > 0 && <span className="text-[10px] font-black text-gray-400 line-through">{formatPrice(product.compareAtPrice)}</span>}
                          <span className="font-black text-black">{formatPrice(product.price)} {t.rial}</span>
                        </div>
                      )}
                    </td>

                    {/* Inline Edit UI: Stock */}
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                           <input 
                             type="number"
                             value={editStock}
                             onChange={e => setEditStock(e.target.value)}
                             className="w-20 px-3 py-2 bg-white border-2 border-black rounded-xl font-black text-sm outline-none"
                           />
                        </div>
                      ) : (
                        <span className={`text-sm font-black ${
                          product.stock > 10 ? 'text-green-600' :
                          product.stock > 0 ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {product.stock} {t.stockUnits}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveInlineEdit(product.id)}
                              disabled={isSavingInline}
                              className="px-3 py-2 bg-black text-white hover:bg-green-600 rounded-xl transition-all font-black text-xs flex items-center gap-1 shadow"
                              title={isRTL ? 'حفظ' : 'Save'}
                            >
                              {isSavingInline ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => setEditingRow(null)}
                              className="px-3 py-2 bg-white border border-gray-200 text-gray-500 hover:text-black rounded-xl transition-all font-black text-xs"
                              title={isRTL ? 'إلغاء' : 'Cancel'}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startInlineEdit(product)}
                              className="p-2 bg-white border border-gray-100 hover:border-black hover:text-black text-gray-500 rounded-xl transition-all"
                              title={isRTL ? 'تعديل سريع' : 'Quick Edit'}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <Link
                              to={`/admin/products/edit/${product.id}`}
                              className="p-2 hover:bg-gray-100 text-gray-400 hover:text-gray-900 rounded-xl transition-all border border-transparent"
                              title={isRTL ? 'تعديل متقدم' : 'Full Edit'}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => toggleVisibility(product)}
                              className={`p-2 rounded-xl transition-all border border-transparent ${product.isVisible ? 'hover:bg-orange-50 text-gray-400 hover:text-orange-600' : 'text-gray-300 hover:bg-green-50 hover:text-green-600'}`}
                              title={product.isVisible ? t.hidden : t.visible}
                            >
                              {product.isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => deleteProduct(product.id)}
                              className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-xl transition-all border border-transparent"
                              title={t.delete}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
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
            <p className="text-gray-400 font-bold">{t.noProductsMatching}</p>
          </div>
        )}
      </div>

      {/* Pricing Modal */}
      {isPricingModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                   <Percent className="w-6 h-6 text-blue-600" />
                   {isRTL ? 'تعديل الأسعار جماعياً' : 'Bulk Pricing Update'}
                </h3>
                <button onClick={() => setIsPricingModalOpen(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                  <X className="w-5 h-5" />
                </button>
             </div>
             
             <p className="text-gray-500 font-bold mb-8">
               {isRTL 
                ? `سيتم تطبيق هذا التعديل على ${selectedIds.length} منتجات محددة. لا يمكن التراجع عن هذه الخطوة.` 
                : `This will update prices for ${selectedIds.length} selected products.`}
             </p>

             <div className="space-y-6">
                <div>
                   <label className="text-xs font-black uppercase text-gray-400 tracking-widest mb-3 block">
                     {isRTL ? 'نوع العملية' : 'Operation Type'}
                   </label>
                   <div className="grid grid-cols-2 gap-3">
                      <button 
                         type="button"
                         onClick={() => setPricingAction('discount')}
                         className={`px-4 py-4 rounded-2xl flex items-center justify-center gap-2 font-black transition-all ${
                          pricingAction === 'discount' ? 'bg-red-100 border-2 border-red-500 text-red-700' : 'bg-gray-50 border-2 border-transparent text-gray-500 hover:bg-gray-100'
                         }`}
                      >
                         <TrendingDown className="w-4 h-4" />
                         {isRTL ? 'تخفيض السعر' : 'Discount'}
                      </button>
                      <button 
                         type="button"
                         onClick={() => setPricingAction('increase')}
                         className={`px-4 py-4 rounded-2xl flex items-center justify-center gap-2 font-black transition-all ${
                          pricingAction === 'increase' ? 'bg-green-100 border-2 border-green-500 text-green-700' : 'bg-gray-50 border-2 border-transparent text-gray-500 hover:bg-gray-100'
                         }`}
                      >
                         <TrendingUp className="w-4 h-4" />
                         {isRTL ? 'زيادة السعر' : 'Increase'}
                      </button>
                   </div>
                </div>

                <div>
                   <label className="text-xs font-black uppercase text-gray-400 tracking-widest mb-3 block">
                     {isRTL ? 'النسبة المئوية (%)' : 'Percentage (%)'}
                   </label>
                   <div className="relative">
                     <Percent className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-4' : 'right-4'} text-gray-400 w-5 h-5`} />
                     <input 
                       type="number"
                       min="1"
                       max="100"
                       value={pricingPercentage}
                       onChange={(e) => setPricingPercentage(e.target.value)}
                       placeholder={isRTL ? "مثال: 15" : "e.g. 15"}
                       className="w-full font-black text-2xl py-4 px-6 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-blue-500 focus:ring-0 outline-none transition-all"
                       dir="ltr"
                     />
                   </div>
                </div>

                <button
                   onClick={applyBulkPricing}
                   disabled={!pricingPercentage || Number(pricingPercentage) <= 0 || isBulkLoading}
                   className="w-full mt-4 py-5 bg-black text-white font-black uppercase tracking-widest rounded-2xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-gray-200 transition-all"
                >
                   {isBulkLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                   {isRTL ? 'تطبيق التعديلات الآن' : 'Apply Changes'}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductsPage;
