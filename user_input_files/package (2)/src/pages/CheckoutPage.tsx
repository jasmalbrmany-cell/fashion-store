import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronRight, MapPin, Phone, User, MessageCircle, Check, ArrowLeft } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { mockStoreSettings, mockCities } from '@/data/mockData';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, getSubtotal, clearCart } = useCart();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: '',
    address: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = getSubtotal();
  const selectedCity = mockCities.find(c => c.id === formData.city);
  const shippingCost = selectedCity?.shippingCost || 0;
  const total = subtotal + shippingCost;
  const currencySymbol = 'ر.ي';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'يرجى إدخال الاسم';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'يرجى إدخال رقم الجوال';
    } else if (!/^[0-9]{9}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'يرجى إدخال رقم جوال صحيح';
    }

    if (!formData.city) {
      newErrors.city = 'يرجى اختيار المدينة';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    // Generate order number
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    // Build WhatsApp message
    const itemsList = items
      .map(
        item =>
          `• ${item.product.name}
  المقاس: ${item.size?.name || '-'}
  اللون: ${item.color?.name || '-'}
  الكمية: ${item.quantity}
  السعر: ${(item.price * item.quantity).toLocaleString('ar-SA')} ${currencySymbol}`
      )
      .join('\n\n');

    const message = `طلب جديد رقم: ${orderNumber}

معلومات العميل:
الاسم: ${formData.name}
الجوال: ${formData.phone}
المدينة: ${selectedCity?.name}
العنوان: ${formData.address || '-'}

المنتجات:
${itemsList}

الملخص:
المجموع الفرعي: ${subtotal.toLocaleString('ar-SA')} ${currencySymbol}
الشحن: ${shippingCost.toLocaleString('ar-SA')} ${currencySymbol}
الإجمالي: ${total.toLocaleString('ar-SA')} ${currencySymbol}

${formData.notes ? `ملاحظات: ${formData.notes}` : ''}`;

    // Get WhatsApp number based on category
    const firstItemCategory = items[0]?.product.categoryId;
    const whatsappNumber =
      firstItemCategory && mockStoreSettings.socialLinks.whatsappCategory?.[firstItemCategory]
        ? mockStoreSettings.socialLinks.whatsappCategory[firstItemCategory]
        : mockStoreSettings.socialLinks.whatsapp;

    // Open WhatsApp
    window.open(
      `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`,
      '_blank'
    );

    // Clear cart and redirect
    setTimeout(() => {
      clearCart();
      navigate('/order-success', {
        state: {
          orderNumber,
          total,
          customerName: formData.name,
          customerPhone: formData.phone,
        },
      });
      setIsSubmitting(false);
    }, 1500);
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('ar-SA');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">السلة فارغة</h2>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            تصفح المنتجات
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-primary-600">الرئيسية</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to="/cart" className="hover:text-primary-600">السلة</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">إتمام الطلب</span>
        </nav>

        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">إتمام الطلب</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 md:p-8 space-y-6">
              <h2 className="text-lg font-bold text-gray-900">معلومات التوصيل</h2>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline ml-1" />
                  الاسم الكامل
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="مثال: محمد أحمد علي"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline ml-1" />
                  رقم الجوال
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="777123456"
                  dir="ltr"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline ml-1" />
                  المدينة
                </label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.city ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">اختر المدينة</option>
                  {mockCities
                    .filter(c => c.isActive)
                    .map(city => (
                      <option key={city.id} value={city.id}>
                        {city.name} - شحن {city.shippingCost.toLocaleString('ar-SA')} {currencySymbol}
                      </option>
                    ))}
                </select>
                {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  العنوان التفصيلي (اختياري)
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="مثال: شارع الزبيري، بجوار المسجد"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ملاحظات إضافية (اختياري)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="أي ملاحظات خاصة بالطلب..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-5 h-5" />
                    تأكيد الطلب عبر واتساب
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-6">ملخص الطلب</h2>

              {/* Items */}
              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                {items.map(item => (
                  <div key={item.id} className="flex gap-3">
                    <img
                      src={item.product.images[0]?.url}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {item.size && `${item.size.name}`}
                        {item.size && item.color && ' / '}
                        {item.color && item.color.name}
                      </p>
                      <p className="text-xs text-gray-500">الكمية: {item.quantity}</p>
                      <p className="font-semibold text-primary-600 text-sm">
                        {formatPrice(item.price * item.quantity)} {currencySymbol}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <hr className="my-4" />

              {/* Totals */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">المجموع الفرعي</span>
                  <span>{formatPrice(subtotal)} {currencySymbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">الشحن</span>
                  <span>
                    {shippingCost > 0
                      ? `${formatPrice(shippingCost)} ${currencySymbol}`
                      : 'يُحسب'}
                  </span>
                </div>
                <hr />
                <div className="flex justify-between text-lg font-bold">
                  <span>الإجمالي</span>
                  <span className="text-primary-600">
                    {total > shippingCost
                      ? `${formatPrice(total)} ${currencySymbol}`
                      : `${formatPrice(subtotal)} ${currencySymbol}`}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  سيتم التواصل معك عبر واتساب لتأكيد طلبك واستكمال عملية الدفع
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
