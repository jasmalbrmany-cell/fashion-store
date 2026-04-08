import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Upload, X, Plus, Check, AlertCircle,
  Image as ImageIcon, Tag, DollarSign, Package, Eye, EyeOff
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { categoriesService, productsService } from '@/services';
import { Category } from '@/types';
import { compressImage } from '@/lib/imageCompression';

const AddProductPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);

  // بيانات النموذج
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

  // جلب الأقسام عند تحميل الصفحة
  useEffect(() => {
    const loadCategories = async () => {
      const cats = await categoriesService.getAll();
      setCategories(cats);
    };
    loadCategories();
  }, []);

  // رفع صور من الجهاز إلى Supabase Storage
  const handleFileUpload = async (files: FileList) => {
    if (!isSupabaseConfigured()) {
      setError('يرجى ربط Supabase لتتمكن من رفع الصور');
      return;
    }

    setUploadingImages(true);
    setError('');

    try {
      const uploadedUrls: { id: string; url: string; isPrimary: boolean }[] = [];

      for (const originalFile of Array.from(files)) {
        if (!originalFile.type.startsWith('image/')) continue;

        // ضغط الصورة وتصغير حجمها (أقصى عرض 800 بكسل، جودة 80%)
        const file = await compressImage(originalFile, 800, 0.8);

        const fileExt = file.name.split('.').pop();
        const fileName = `products/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, file, { cacheControl: '3600', upsert: false });

        if (uploadError) {
          // إذا فشل الرفع، استخدم URL محلي مؤقت
          const localUrl = URL.createObjectURL(file);
          uploadedUrls.push({
            id: `img-${Date.now()}-${Math.random()}`,
            url: localUrl,
            isPrimary: formData.images.length === 0 && uploadedUrls.length === 0,
          });
        } else {
          const { data: publicData } = supabase.storage
            .from('product-images')
            .getPublicUrl(data.path);

          uploadedUrls.push({
            id: `img-${Date.now()}-${Math.random()}`,
            url: publicData.publicUrl,
            isPrimary: formData.images.length === 0 && uploadedUrls.length === 0,
          });
        }
      }

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }));
    } catch (err) {
      setError('حدث خطأ أثناء رفع الصور');
    } finally {
      setUploadingImages(false);
    }
  };

  // إضافة صورة عبر رابط URL
  const addImageByUrl = () => {
    const url = prompt('أدخل رابط الصورة:');
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

  // حذف صورة
  const removeImage = (index: number) => {
    setFormData(prev => {
      const newImages = prev.images.filter((_, i) => i !== index);
      if (newImages.length > 0 && !newImages.some(img => img.isPrimary)) {
        newImages[0].isPrimary = true;
      }
      return { ...prev, images: newImages };
    });
  };

  // تعيين صورة رئيسية
  const setPrimaryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => ({ ...img, isPrimary: i === index })),
    }));
  };

  // إضافة مقاس
  const addSize = () => {
    setFormData(prev => ({
      ...prev,
      sizes: [
        ...prev.sizes,
        { id: `size-${Date.now()}`, name: '', stock: 0, priceModifier: 0 },
      ],
    }));
  };

  // تحديث مقاس
  const updateSize = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.map((s, i) => i === index ? { ...s, [field]: value } : s),
    }));
  };

  // حذف مقاس
  const removeSize = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index),
    }));
  };

  // إضافة لون
  const addColor = () => {
    setFormData(prev => ({
      ...prev,
      colors: [
        ...prev.colors,
        { id: `color-${Date.now()}`, name: '', hex: '#000000', stock: 0 },
      ],
    }));
  };

  // تحديث لون
  const updateColor = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.map((c, i) => i === index ? { ...c, [field]: value } : c),
    }));
  };

  // حذف لون
  const removeColor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index),
    }));
  };

  // حفظ المنتج
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('يرجى إدخال اسم المنتج');
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('يرجى إدخال سعر صحيح');
      return;
    }
    if (!formData.categoryId) {
      setError('يرجى اختيار القسم');
      return;
    }

    setIsSubmitting(true);

    const totalStock = formData.sizes.length > 0
      ? formData.sizes.reduce((sum, s) => sum + s.stock, 0)
      : parseInt(formData.stock) || 0;

    const result = await productsService.create({
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
    });

    setIsSubmitting(false);

    if (result) {
      setSuccess('تم إضافة المنتج بنجاح!');
      setTimeout(() => navigate('/admin/products'), 1500);
    } else {
      setError('حدث خطأ أثناء حفظ المنتج، يرجى المحاولة مرة أخرى');
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* الرأس */}
      <div className="flex items-center gap-4">
        <Link to="/admin/products" className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إضافة منتج جديد</h1>
          <p className="text-gray-500 text-sm">أضف منتج جديد إلى المتجر</p>
        </div>
      </div>

      {/* رسائل النجاح والخطأ */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700">
          <Check className="w-5 h-5 flex-shrink-0" />
          <p>{success}</p>
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* المعلومات الأساسية */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <Tag className="w-5 h-5 text-gray-600" />
            المعلومات الأساسية
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {/* اسم المنتج */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم المنتج <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                placeholder="مثال: فستان سهرة أنيق"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition"
                required
              />
            </div>

            {/* الوصف */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                rows={4}
                placeholder="اكتب وصفاً تفصيلياً للمنتج..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition resize-none"
              />
            </div>

            {/* السعر */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline ml-1" />
                السعر (ريال يمني) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={e => setFormData(p => ({ ...p, price: e.target.value }))}
                placeholder="45000"
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition"
                required
              />
            </div>

            {/* القسم */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                القسم <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.categoryId}
                onChange={e => setFormData(p => ({ ...p, categoryId: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition bg-white"
                required
              >
                <option value="">اختر القسم</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* المخزون */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Package className="w-4 h-4 inline ml-1" />
                الكمية في المخزون
              </label>
              <input
                type="number"
                value={formData.stock}
                onChange={e => setFormData(p => ({ ...p, stock: e.target.value }))}
                placeholder="0"
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition"
              />
            </div>

            {/* رابط المصدر */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رابط المصدر (اختياري)
              </label>
              <input
                type="url"
                value={formData.sourceUrl}
                onChange={e => setFormData(p => ({ ...p, sourceUrl: e.target.value }))}
                placeholder="https://aliexpress.com/..."
                dir="ltr"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition"
              />
            </div>

            {/* الظهور */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition">
                <div
                  onClick={() => setFormData(p => ({ ...p, isVisible: !p.isVisible }))}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    formData.isVisible ? 'bg-black' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      formData.isVisible ? 'right-1' : 'left-1'
                    }`}
                  />
                </div>
                <div>
                  <span className="font-medium text-gray-900 flex items-center gap-1">
                    {formData.isVisible ? (
                      <><Eye className="w-4 h-4" /> ظاهر للعملاء</>
                    ) : (
                      <><EyeOff className="w-4 h-4" /> مخفي من العملاء</>
                    )}
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* الصور */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-gray-600" />
              صور المنتج
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={addImageByUrl}
                className="text-sm px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                إضافة رابط
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition flex items-center gap-1"
                disabled={uploadingImages}
              >
                <Upload className="w-4 h-4" />
                {uploadingImages ? 'جاري الرفع...' : 'رفع صور'}
              </button>
            </div>
          </div>

          {/* رفع من الجهاز */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => e.target.files && handleFileUpload(e.target.files)}
          />

          {/* منطقة السحب والإفلات */}
          {formData.images.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-black hover:bg-gray-50 transition"
            >
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">انقر هنا لرفع الصور من جهازك</p>
              <p className="text-gray-400 text-sm mt-1">أو أضف روابط الصور من الإنترنت</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {formData.images.map((image, index) => (
                <div key={image.id} className="relative group rounded-xl overflow-hidden border-2 border-transparent hover:border-black transition">
                  <img
                    src={image.url}
                    alt={`صورة ${index + 1}`}
                    className="w-full aspect-square object-cover"
                  />
                  {image.isPrimary && (
                    <div className="absolute top-2 right-2 bg-black text-white text-xs px-2 py-1 rounded-full">
                      رئيسية
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                    {!image.isPrimary && (
                      <button
                        type="button"
                        onClick={() => setPrimaryImage(index)}
                        className="px-2 py-1 bg-white text-black text-xs rounded-lg"
                      >
                        تعيين رئيسية
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="p-1 bg-red-500 text-white rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {/* إضافة صورة جديدة */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl aspect-square flex items-center justify-center cursor-pointer hover:border-black hover:bg-gray-50 transition"
              >
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
            </div>
          )}
        </div>

        {/* المقاسات */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900">المقاسات</h2>
            <button
              type="button"
              onClick={addSize}
              className="flex items-center gap-1 text-sm px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
            >
              <Plus className="w-4 h-4" />
              إضافة مقاس
            </button>
          </div>

          {formData.sizes.length === 0 ? (
            <p className="text-gray-400 text-center py-6">لا توجد مقاسات - اضغط "إضافة مقاس" لإضافة المقاسات المتاحة</p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-3 text-sm font-medium text-gray-500 px-2">
                <span>المقاس</span>
                <span>المخزون</span>
                <span>تعديل السعر</span>
                <span></span>
              </div>
              {formData.sizes.map((size, index) => (
                <div key={size.id} className="grid grid-cols-4 gap-3 items-center">
                  <input
                    type="text"
                    value={size.name}
                    onChange={e => updateSize(index, 'name', e.target.value)}
                    placeholder="S, M, L, XL, 40..."
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition"
                  />
                  <input
                    type="number"
                    value={size.stock}
                    onChange={e => updateSize(index, 'stock', parseInt(e.target.value) || 0)}
                    placeholder="0"
                    min="0"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition"
                  />
                  <input
                    type="number"
                    value={size.priceModifier}
                    onChange={e => updateSize(index, 'priceModifier', parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => removeSize(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* الألوان */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900">الألوان</h2>
            <button
              type="button"
              onClick={addColor}
              className="flex items-center gap-1 text-sm px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
            >
              <Plus className="w-4 h-4" />
              إضافة لون
            </button>
          </div>

          {formData.colors.length === 0 ? (
            <p className="text-gray-400 text-center py-6">لا توجد ألوان - اضغط "إضافة لون" لإضافة الألوان المتاحة</p>
          ) : (
            <div className="space-y-3">
              {formData.colors.map((color, index) => (
                <div key={color.id} className="flex items-center gap-3">
                  <input
                    type="color"
                    value={color.hex}
                    onChange={e => updateColor(index, 'hex', e.target.value)}
                    className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer p-1"
                  />
                  <input
                    type="text"
                    value={color.name}
                    onChange={e => updateColor(index, 'name', e.target.value)}
                    placeholder="اسم اللون (أحمر، أزرق...)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition"
                  />
                  <input
                    type="number"
                    value={color.stock}
                    onChange={e => updateColor(index, 'stock', parseInt(e.target.value) || 0)}
                    placeholder="المخزون"
                    min="0"
                    className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => removeColor(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* أزرار الحفظ */}
        <div className="flex justify-end gap-4">
          <Link
            to="/admin/products"
            className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition font-medium"
          >
            إلغاء
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition"
          >
            {isSubmitting ? (
              <>
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                حفظ المنتج
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProductPage;
