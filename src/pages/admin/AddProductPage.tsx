import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Upload, X, Plus, Check, AlertCircle,
  Image as ImageIcon, Tag, DollarSign, Package, Eye, EyeOff, Loader2
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { categoriesService, productsService } from '@/services';
import { Category, Product } from '@/types';
import { compressImage } from '@/lib/imageCompression';
import { useLanguage } from '@/context/LanguageContext';

const AddProductPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const { isRTL, t, language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    stock: '0',
    isVisible: true,
    sourceUrl: '',
    images: [] as { id: string; url: string; isPrimary: boolean }[],
    sizes: [] as { id: string; name: string; stock: number; priceModifier: number }[],
    colors: [] as { id: string; name: string; hex: string; stock: number }[],
  });

  useEffect(() => {
    const initData = async () => {
      setIsLoading(true);
      try {
        const cats = await categoriesService.getAll();
        setCategories(cats);

        if (isEditMode && id) {
          const product = await productsService.getById(id);
          if (product) {
            setFormData({
              name: product.name,
              description: product.description || '',
              price: product.price.toString(),
              categoryId: product.categoryId,
              stock: product.stock.toString(),
              isVisible: product.isVisible,
              sourceUrl: product.sourceUrl || '',
              images: product.images || [],
              sizes: product.sizes || [],
              colors: product.colors || [],
            });
          }
        }
      } catch (err) {
        console.error('Failed to init data', err);
        setError(isRTL ? 'حدث خطأ أثناء تحميل البيانات' : 'Error loading data');
      } finally {
        setIsLoading(false);
      }
    };
    initData();
  }, [id, isEditMode, isRTL]);

  const handleFileUpload = async (files: FileList) => {
    setUploadingImages(true);
    setError('');

    try {
      const uploadedUrls: { id: string; url: string; isPrimary: boolean }[] = [];

      for (const originalFile of Array.from(files)) {
        if (!originalFile.type.startsWith('image/')) continue;

        const file = await compressImage(originalFile, 800, 0.8);

        if (isSupabaseConfigured()) {
            try {
                const fileExt = file.name.split('.').pop();
                const fileName = `products/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

                const { data, error: uploadError } = await supabase.storage
                    .from('product-images')
                    .upload(fileName, file, { cacheControl: '3600', upsert: false });

                if (!uploadError) {
                    const { data: publicData } = supabase.storage
                    .from('product-images')
                    .getPublicUrl(data.path);

                    uploadedUrls.push({
                        id: `img-${Date.now()}-${Math.random()}`,
                        url: publicData.publicUrl,
                        isPrimary: formData.images.length === 0 && uploadedUrls.length === 0,
                    });
                    continue;
                }
                console.error('Supabase upload error:', uploadError);
            } catch (err) {
                console.error('Supabase catch error:', err);
            }
        }

        // Fallback or Demo Mode Data URL to allow persistence
        const fileToBase64 = (file: File): Promise<string> => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = error => reject(error);
            });
        };
        const localUrl = await fileToBase64(file);
        uploadedUrls.push({
          id: `img-${Date.now()}-${Math.random()}`,
          url: localUrl,
          isPrimary: formData.images.length === 0 && uploadedUrls.length === 0,
        });
      }

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }));
    } catch (err) {
      setError(isRTL ? 'حدث خطأ أثناء رفع الصور' : 'Error uploading images');
    } finally {
      setUploadingImages(false);
    }
  };

  const addImageByUrl = () => {
    const url = prompt(isRTL ? 'أدخل رابط الصورة:' : 'Enter image URL:');
    if (url && url.trim()) {
      setFormData(prev => ({
        ...prev,
        images: [
          ...prev.images,
          {
            id: `img-${Date.now()}`,
            url: url.trim(),
            isPrimary: prev.images.length === 0,
          },
        ],
      }));
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => {
      const newImages = prev.images.filter((_, i) => i !== index);
      if (newImages.length > 0 && !newImages.some(img => img.isPrimary)) {
        newImages[0].isPrimary = true;
      }
      return { ...prev, images: newImages };
    });
  };

  const setPrimaryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => ({ ...img, isPrimary: i === index })),
    }));
  };

  const addSize = () => {
    setFormData(prev => ({
      ...prev,
      sizes: [
        ...prev.sizes,
        { id: `size-${Date.now()}`, name: '', stock: 0, priceModifier: 0 },
      ],
    }));
  };

  const updateSize = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.map((s, i) => i === index ? { ...s, [field]: value } : s),
    }));
  };

  const removeSize = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index),
    }));
  };

  const addColor = () => {
    setFormData(prev => ({
      ...prev,
      colors: [
        ...prev.colors,
        { id: `color-${Date.now()}`, name: '', hex: '#000000', stock: 0 },
      ],
    }));
  };

  const updateColor = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.map((c, i) => i === index ? { ...c, [field]: value } : c),
    }));
  };

  const removeColor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
        if (!formData.name.trim()) {
            throw new Error(isRTL ? 'يرجى إدخال اسم المنتج' : 'Please enter product name');
        }
        if (!formData.price || parseFloat(formData.price) <= 0) {
            throw new Error(isRTL ? 'يرجى إدخال سعر صحيح' : 'Please enter a valid price');
        }
        if (!formData.categoryId) {
            throw new Error(isRTL ? 'يرجى اختيار القسم' : 'Please select a category');
        }

        const totalStock = formData.sizes.length > 0
        ? formData.sizes.reduce((sum, s) => sum + s.stock, 0)
        : parseInt(formData.stock) || 0;

        const productData = {
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.price),
            categoryId: formData.categoryId,
            stock: totalStock,
            isVisible: formData.isVisible,
            sourceUrl: formData.sourceUrl || undefined,
            images: formData.images,
            sizes: formData.sizes,
            colors: formData.colors,
        };

        if (isEditMode && id) {
            const updated = await productsService.update(id, productData);
            if (!updated) throw new Error(t.errorSavingProduct);
            setSuccess(t.productUpdatedSuccess);
        } else {
            const created = await productsService.create(productData);
            if (!created) throw new Error(t.errorSavingProduct);
            setSuccess(t.productAddedSuccess);
        }

        setTimeout(() => navigate('/admin/products'), 1500);
    } catch (err: any) {
        setError(err.message || t.errorSavingProduct);
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-black" />
            <p className="font-bold text-gray-400 animate-pulse">{t.loading}</p>
        </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 px-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/admin/products" className="p-3 hover:bg-gray-100 rounded-2xl transition-all border shrink-0">
          <ArrowLeft className={`w-6 h-6 ${isRTL ? '' : 'rotate-180'}`} />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-gray-900">{isEditMode ? t.editProduct : t.addProduct}</h1>
          <p className="text-gray-500 font-bold">{isEditMode ? t.editProduct : t.addProduct}</p>
        </div>
      </div>

      {/* Notifications */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3 text-green-700 font-black animate-in fade-in slide-in-from-top-4">
          <Check className="w-6 h-6" />
          <p>{success}</p>
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700 font-black animate-in fade-in slide-in-from-top-4">
          <AlertCircle className="w-6 h-6" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="bg-white rounded-3xl shadow-sm border p-6 md:p-8 space-y-8">
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b pb-4">
            <Tag className="w-5 h-5 text-black" />
            {t.generalInfo}
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="md:col-span-2 space-y-3">
              <label className="block text-xs font-black uppercase tracking-widest text-gray-500">{t.productName}</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                placeholder={isRTL ? 'مثال: فستان سهرة مخملي' : 'e.g. Velvet Evening Gown'}
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black focus:bg-white transition-all outline-none font-bold shadow-inner"
                required
              />
            </div>

            <div className="md:col-span-2 space-y-3">
              <label className="block text-xs font-black uppercase tracking-widest text-gray-500">{t.detailedDescription}</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                rows={4}
                placeholder={isRTL ? 'اشرح تفاصيل المنتج، المواد، والتصميم...' : 'Describe materials, design details, and fit...'}
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black focus:bg-white transition-all outline-none resize-none font-medium shadow-inner"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-black uppercase tracking-widest text-gray-500">{t.productPrice} ({t.rial})</label>
              <div className="relative">
                <DollarSign className={`absolute ${isRTL ? 'left-6' : 'right-6'} top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5`} />
                <input
                  type="number"
                  value={formData.price}
                  onChange={e => setFormData(p => ({ ...p, price: e.target.value }))}
                  placeholder="0.00"
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black focus:bg-white transition-all outline-none font-black shadow-inner"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-black uppercase tracking-widest text-gray-500">{t.productCategory}</label>
              <select
                value={formData.categoryId}
                onChange={e => setFormData(p => ({ ...p, categoryId: e.target.value }))}
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black outline-none font-bold appearance-none shadow-inner"
                required
              >
                <option value="">{t.selectCategory}</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Media Block */}
        <div className="bg-white rounded-3xl shadow-sm border p-6 md:p-8 space-y-8">
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-black" />
              {t.visualAssets}
            </h2>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={addImageByUrl}
                className="text-xs font-black uppercase tracking-widest px-4 py-2 border rounded-xl hover:bg-gray-50 transition"
              >
                {t.fromUrl}
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-black uppercase tracking-widest px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition flex items-center gap-2 shadow-lg shadow-gray-200"
                disabled={uploadingImages}
              >
                <Upload className="w-4 h-4" />
                {uploadingImages ? '...' : t.uploadImages}
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => e.target.files && handleFileUpload(e.target.files)}
          />

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {formData.images.map((image, index) => (
              <div key={image.id} className={`relative group aspect-square rounded-2xl overflow-hidden border-2 transition ${image.isPrimary ? 'border-black ring-4 ring-black/5' : 'border-transparent hover:border-black'}`}>
                <img src={image.url} className="w-full h-full object-cover" />
                {image.isPrimary && (
                   <div className="absolute top-2 right-2 bg-black text-white text-[10px] font-black px-2 py-1 rounded-lg z-10">{t.mainImage}</div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 backdrop-blur-sm">
                  <button type="button" title={t.mainImage} onClick={() => setPrimaryImage(index)} className="p-2 bg-white rounded-lg text-black hover:scale-110 transition shadow-lg"><Check className="w-4 h-4" /></button>
                  <button type="button" title={t.delete} onClick={() => removeImage(index)} className="p-2 bg-white rounded-lg text-red-500 hover:scale-110 transition shadow-lg"><X className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-300 hover:text-black hover:border-black group transition-all"
            >
              <Plus className="w-8 h-8 group-hover:scale-125 transition-transform" />
              <span className="text-[10px] font-black uppercase">{t.add}</span>
            </button>
          </div>
        </div>

        {/* Variants Block */}
        <div className="bg-white rounded-3xl shadow-sm border p-6 md:p-8 space-y-8">
           <div className="flex items-center justify-between border-b pb-4">
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-black" />
                {t.sizesAndVariants}
              </h2>
              <button type="button" onClick={addSize} className="px-4 py-2 bg-gray-50 hover:bg-black hover:text-white rounded-xl text-xs font-black transition-all border">
                {t.addSize}
              </button>
           </div>

           <div className="space-y-4">
              {formData.sizes.map((size, index) => (
                <div key={size.id} className="flex flex-col md:flex-row gap-4 p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-gray-200 transition">
                   <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-400 px-1">{t.size}</label>
                        <input
                            type="text"
                            value={size.name}
                            onChange={e => updateSize(index, 'name', e.target.value)}
                            placeholder={isRTL ? 'المقاس' : 'Size'}
                            className="w-full px-4 py-2 rounded-xl outline-none font-bold bg-white border border-gray-100"
                        />
                   </div>
                   <div className="w-full md:w-32 space-y-1">
                        <label className="text-[10px] font-black uppercase text-gray-400 px-1">{t.stockLabel}</label>
                        <input
                            type="number"
                            value={size.stock}
                            onChange={e => updateSize(index, 'stock', parseInt(e.target.value) || 0)}
                            placeholder={isRTL ? 'المخزون' : 'Stock'}
                            className="w-full px-4 py-2 rounded-xl outline-none font-bold bg-white border border-gray-100"
                        />
                   </div>
                   <button type="button" onClick={() => removeSize(index)} className="self-end p-3 text-gray-400 hover:text-red-500 bg-white rounded-xl border hover:border-red-100 transition shadow-sm"><X className="w-4 h-4" /></button>
                </div>
              ))}
           </div>

           <div className="flex justify-between items-center pt-8 border-t">
              <h3 className="font-black text-gray-900">{t.colorMapping}</h3>
              <button type="button" onClick={addColor} className="px-4 py-2 bg-gray-50 hover:bg-black hover:text-white rounded-xl text-xs font-black transition-all border">
                {t.addColor}
              </button>
           </div>
           
           <div className="grid md:grid-cols-2 gap-4">
              {formData.colors.map((color, index) => (
                <div key={color.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl relative group border border-transparent hover:border-gray-200 transition">
                  <div className="relative shrink-0">
                    <input type="color" value={color.hex} onChange={e => updateColor(index, 'hex', e.target.value)} className="w-10 h-10 rounded-lg overflow-hidden border-2 border-white cursor-pointer p-0 shadow-sm" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 px-1">{t.color}</label>
                    <input type="text" value={color.name} onChange={e => updateColor(index, 'name', e.target.value)} placeholder={isRTL ? 'اسم اللون' : 'Color Name'} className="w-full bg-white px-3 py-1.5 rounded-lg border border-gray-100 outline-none font-bold" />
                  </div>
                  <button type="button" onClick={() => removeColor(index)} className="p-2 text-gray-400 hover:text-red-500 bg-white rounded-lg border hover:border-red-100 shadow-sm"><X className="w-4 h-4" /></button>
                </div>
              ))}
           </div>
        </div>

        {/* Settings Block */}
        <div className="bg-white rounded-3xl shadow-sm border p-6 md:p-8 space-y-6">
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 border-b pb-4">
                <Eye className="w-5 h-5 text-black" />
                {t.visibilityStatus}
            </h2>
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        id="isVisible"
                        checked={formData.isVisible}
                        onChange={e => setFormData(p => ({ ...p, isVisible: e.target.checked }))}
                        className="w-6 h-6 rounded-lg border-gray-300 accent-black cursor-pointer"
                    />
                    <label htmlFor="isVisible" className="text-sm font-black text-gray-700 cursor-pointer">{t.visible}</label>
                </div>
                {!formData.isVisible && (
                    <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-3 py-1 rounded-lg">
                        <EyeOff className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase">{t.hidden}</span>
                    </div>
                )}
            </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-end gap-6 pt-6 sticky bottom-6 z-20">
           <Link to="/admin/products" className="px-10 py-4 font-black uppercase tracking-widest text-sm text-gray-400 hover:text-red-500 transition-colors bg-white/80 backdrop-blur-md rounded-2xl">{t.cancel}</Link>
           <button
            type="submit"
            disabled={isSubmitting}
            className="px-12 py-4 bg-black text-white rounded-2xl font-black hover:bg-gray-800 shadow-2xl shadow-black/20 disabled:opacity-50 flex items-center gap-3 active:scale-95 transition-all uppercase tracking-widest text-sm"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
            {isSubmitting ? t.saving : t.saveFinalProduct}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProductPage;
