import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Link as LinkIcon,
  Loader,
  Check,
  AlertCircle,
  Image,
  X,
  Plus,
} from 'lucide-react';
import { mockCategories } from '@/data/mockData';

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
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [importedProduct, setImportedProduct] = useState<ImportedProduct | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    images: [] as string[],
    sizes: [] as { id: string; name: string; stock: number; priceModifier: number }[],
    colors: [] as { id: string; name: string; hex: string; stock: number }[],
    isVisible: true,
  });

  const handleFetchProduct = async () => {
    if (!url.trim()) {
      setError('يرجى إدخال رابط المنتج');
      return;
    }

    setIsLoading(true);
    setError('');

    // Simulate fetching product data
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock imported data
    const mockData: ImportedProduct = {
      name: 'فستان سهرة أنيق - موديل 2024',
      description: 'فستان سهرة فاخر مصنوع من الحرير الطبيعي، مناسب للمناسبات الرسمية والسهرات. يتميز بتصميم عصري وأنيق.',
      price: 45000,
      currency: 'YER',
      images: [
        'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500',
        'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=500',
      ],
      sizes: [
        { name: 'S' },
        { name: 'M' },
        { name: 'L' },
        { name: 'XL' },
      ],
      colors: [
        { name: 'أحمر', hex: '#DC2626' },
        { name: 'أزرق', hex: '#2563EB' },
        { name: 'أسود', hex: '#1F2937' },
      ],
      sourceUrl: url,
    };

    setImportedProduct(mockData);
    setFormData({
      name: mockData.name,
      description: mockData.description,
      price: mockData.price.toString(),
      categoryId: '',
      images: mockData.images,
      sizes: mockData.sizes.map((s, i) => ({
        id: `size-${i}`,
        name: s.name,
        stock: 10,
        priceModifier: 0,
      })),
      colors: mockData.colors.map((c, i) => ({
        id: `color-${i}`,
        name: c.name,
        hex: c.hex,
        stock: 10,
      })),
      isVisible: true,
    });

    setIsLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In real app, send to backend
    alert('تم استيراد المنتج بنجاح!');
    navigate('/admin/products');
  };

  const addImage = () => {
    const imageUrl = prompt('أدخل رابط الصورة:');
    if (imageUrl) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, imageUrl],
      }));
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
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
      sizes: prev.sizes.map((s, i) =>
        i === index ? { ...s, [field]: value } : s
      ),
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
      colors: prev.colors.map((c, i) =>
        i === index ? { ...c, [field]: value } : c
      ),
    }));
  };

  const removeColor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/admin/products"
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">استيراد منتج</h1>
          <p className="text-gray-500">استورد منتجات من أي موقع خارجي</p>
        </div>
      </div>

      {/* URL Input */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">رابط المنتج</h2>
        <div className="flex gap-4">
          <div className="relative flex-1">
            <LinkIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.aliexpress.com/item/..."
              className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleFetchProduct}
            disabled={isLoading}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                جاري الجلب...
              </>
            ) : (
              'استيراد البيانات'
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <p className="mt-4 text-sm text-gray-500">
          يمكنك استيراد المنتجات من: AliExpress، Amazon، نون، شي إن، وجميع المواقع الأخرى
        </p>
      </div>

      {/* Product Form */}
      {importedProduct && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">تفاصيل المنتج</h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">اسم المنتج</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">السعر (ريال يمني)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">القسم</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">اختر القسم</option>
                  {mockCategories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Source URL */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">رابط المصدر</label>
                <input
                  type="url"
                  value={importedProduct.sourceUrl}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">الصور</h2>
              <button
                type="button"
                onClick={addImage}
                className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
              >
                <Plus className="w-5 h-5" />
                إضافة صورة
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {formData.images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`صورة ${index + 1}`}
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Sizes */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">المقاسات</h2>
              <button
                type="button"
                onClick={addSize}
                className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
              >
                <Plus className="w-5 h-5" />
                إضافة مقاس
              </button>
            </div>

            <div className="space-y-3">
              {formData.sizes.map((size, index) => (
                <div key={size.id} className="flex items-center gap-4">
                  <input
                    type="text"
                    value={size.name}
                    onChange={(e) => updateSize(index, 'name', e.target.value)}
                    placeholder="المقاس (مثال: M)"
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="number"
                    value={size.stock}
                    onChange={(e) => updateSize(index, 'stock', parseInt(e.target.value) || 0)}
                    placeholder="المخزون"
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="number"
                    value={size.priceModifier}
                    onChange={(e) => updateSize(index, 'priceModifier', parseInt(e.target.value) || 0)}
                    placeholder="تعديل السعر"
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeSize(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">الألوان</h2>
              <button
                type="button"
                onClick={addColor}
                className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
              >
                <Plus className="w-5 h-5" />
                إضافة لون
              </button>
            </div>

            <div className="space-y-3">
              {formData.colors.map((color, index) => (
                <div key={color.id} className="flex items-center gap-4">
                  <input
                    type="color"
                    value={color.hex}
                    onChange={(e) => updateColor(index, 'hex', e.target.value)}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={color.name}
                    onChange={(e) => updateColor(index, 'name', e.target.value)}
                    placeholder="اسم اللون"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="number"
                    value={color.stock}
                    onChange={(e) => updateColor(index, 'stock', parseInt(e.target.value) || 0)}
                    placeholder="المخزون"
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeColor(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Link
              to="/admin/products"
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              إلغاء
            </Link>
            <button
              type="submit"
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
            >
              <Check className="w-5 h-5" />
              استيراد المنتج
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ImportProductPage;
