import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, Phone, User, MessageCircle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { citiesService, storeSettingsService, ordersService } from '@/services/api';
import { City, StoreSettings } from '@/types';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, getSubtotal, clearCart } = useCart();
  const { t, language, isRTL } = useLanguage();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState<City[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: '',
    address: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [citiesData, settingsData] = await Promise.all([
          citiesService.getActive(),
          storeSettingsService.get()
        ]);
        setCities(citiesData);
        setSettings(settingsData);
      } catch (error) {
        console.error('Failed to fetch checkout data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const subtotal = getSubtotal();
  const selectedCity = cities.find(c => c.id === formData.city);
  const shippingCost = selectedCity?.shippingCost || 0;
  const total = subtotal + shippingCost;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = t.enterFullName;
    if (!formData.phone.trim()) {
      newErrors.phone = t.enterPhone;
    } else if (!/^[0-9]{7,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = t.phoneValidation;
    }
    if (!formData.city) newErrors.city = t.chooseCity;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);

    const orderNumber = `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    // ── حفظ الطلب في قاعدة البيانات ──
    try {
      await ordersService.create({
        orderNumber,
        customerName: formData.name,
        customerPhone: formData.phone,
        customerId: user?.id,
        city: selectedCity?.name || formData.city,
        address: formData.address,
        items: items.map(item => ({
          id: item.id,
          productId: item.productId,
          productName: item.product.name,
          productImage: item.product.images[0]?.url || '',
          size: item.size?.name,
          color: item.color?.name,
          quantity: item.quantity,
          price: item.price,
          sourceUrl: item.product.sourceUrl,
        })),
        subtotal,
        shippingCost,
        total,
        notes: formData.notes,
      });
    } catch (err) {
      console.error('Failed to save order to database:', err);
      // Continue anyway — WhatsApp order is the primary confirmation
    }

    const message = `🛍️ *${isRTL ? 'طلب جديد من المتجر' : 'New Order from Store'}*
---------------------------
🆔 *${t.orderNumber}:* ${orderNumber}

👤 *${t.customerInfo}:*
• *${t.name}:* ${formData.name}
• *${t.phone}:* ${formData.phone}
• *${t.city}:* ${selectedCity?.name}
• *${t.detailedAddress}:* ${formData.address || '-'}

🛒 *${t.products}:*
${items.map((item, i) => `\n${i + 1}. *${item.product.name}*\n   📏 ${t.size}: ${item.size?.name || '-'}\n   🎨 ${t.color}: ${item.color?.name || '-'}\n   🔢 ${t.quantity}: ${item.quantity}\n   💰 ${t.price}: ${formatPrice(item.price * item.quantity)} ${t.rial}`).join('\n')}

---------------------------
📊 *${t.orderSummary}:*
• *${t.subtotal}:* ${formatPrice(subtotal)} ${t.rial}
• *${t.shipping}:* ${formatPrice(shippingCost)} ${t.rial}
• *${t.total}:* ${formatPrice(total)} ${t.rial}

${formData.notes ? `\n📝 *${t.additionalNotes}:*\n${formData.notes}` : ''}
---------------------------
🚀 *${isRTL ? 'شكراً لتعاملك معنا!' : 'Thank you for shopping with us!'}*`;

    // Try to find the first category with a specific WhatsApp number
    let whatsappNumber = settings?.socialLinks.whatsapp || '';
    
    // Check if any product category has a specific number
    for (const item of items) {
      const catId = item.product.categoryId;
      if (settings?.socialLinks.whatsappCategory?.[catId]) {
        whatsappNumber = settings.socialLinks.whatsappCategory[catId];
        break; // Priority to the first specialized number found
      }
    }

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');

    setTimeout(() => {
      clearCart();
      navigate('/order-success', {
        state: { orderNumber, total, customerName: formData.name, customerPhone: formData.phone }
      });
      setIsSubmitting(false);
    }, 1500);
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US');
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-black" />
        <p className="text-gray-500 font-medium">{t.loading}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="text-center p-8 bg-white rounded-3xl shadow-sm">
          <h2 className="text-2xl font-black text-gray-900 mb-6">{t.emptyCart}</h2>
          <Link to="/products" className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white rounded-2xl font-black hover:bg-gray-800 transition shadow-xl">
            {t.browseProducts}
          </Link>
        </div>
      </div>
    );
  }

  const BreadcrumbIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <div className="bg-gray-50 min-h-screen py-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8 overflow-x-auto scrollbar-hide">
          <Link to="/" className="hover:text-black whitespace-nowrap">{t.home}</Link>
          <BreadcrumbIcon className="w-4 h-4" />
          <Link to="/cart" className="hover:text-black whitespace-nowrap">{t.cart}</Link>
          <BreadcrumbIcon className="w-4 h-4" />
          <span className="text-black font-bold whitespace-nowrap">{t.checkout}</span>
        </nav>

        <h1 className="text-3xl lg:text-4xl font-black text-gray-900 mb-10">{t.checkout}</h1>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-8">
            <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border p-6 md:p-10 space-y-8">
              <div className="flex items-center gap-3 pb-4 border-b">
                <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center font-bold">1</div>
                <h2 className="text-xl font-black text-gray-900">{t.deliveryInfo}</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="md:col-span-1">
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                    {t.fullName}
                  </label>
                  <div className="relative">
                    <User className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400`} />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder={t.enterFullName}
                      className={`w-full ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-4 bg-gray-50 border rounded-2xl focus:ring-2 focus:ring-black focus:bg-white transition-all outline-none ${
                        errors.name ? 'border-red-500' : 'border-gray-100'
                      }`}
                    />
                  </div>
                  {errors.name && <p className="text-red-500 text-xs mt-2 font-bold">{errors.name}</p>}
                </div>

                {/* Phone */}
                <div className="md:col-span-1">
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                    {t.phone}
                  </label>
                  <div className="relative">
                    <Phone className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400`} />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="777123456"
                      dir="ltr"
                      className={`w-full ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-4 bg-gray-50 border rounded-2xl focus:ring-2 focus:ring-black focus:bg-white transition-all outline-none ${
                        errors.phone ? 'border-red-500' : 'border-gray-100'
                      }`}
                    />
                  </div>
                  {errors.phone && <p className="text-red-500 text-xs mt-2 font-bold">{errors.phone}</p>}
                </div>

                {/* City */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                    {t.city}
                  </label>
                  <div className="relative">
                    <MapPin className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none`} />
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className={`w-full ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-4 bg-gray-50 border rounded-2xl focus:ring-2 focus:ring-black focus:bg-white transition-all outline-none appearance-none ${
                        errors.city ? 'border-red-500' : 'border-gray-100'
                      }`}
                    >
                      <option value="">{t.chooseCity}</option>
                      {cities.map(city => (
                        <option key={city.id} value={city.id}>
                          {city.name} - {t.shipping}: {formatPrice(city.shippingCost)} {t.rial}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.city && <p className="text-red-500 text-xs mt-2 font-bold">{errors.city}</p>}
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                    {t.detailedAddress}
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder={t.addressPlaceholder}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black focus:bg-white transition-all outline-none"
                  />
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                    {t.additionalNotes}
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={4}
                    placeholder={t.notesPlaceholder}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black focus:bg-white transition-all outline-none resize-none"
                  />
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all shadow-xl hover:shadow-green-200 ${
                    isSubmitting
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
                      {t.sending}
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-6 h-6" />
                      {t.confirmViaWhatsapp}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Sticky Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-sm border p-6 md:p-8 sticky top-24 space-y-6">
              <h2 className="text-xl font-black text-gray-900 border-b pb-4">{t.paymentSummaryLabel}</h2>

              {/* Scrollable Items List */}
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {items.map(item => (
                  <div key={item.id} className="flex gap-4 p-2 hover:bg-gray-50 rounded-xl transition-colors">
                    <img
                      src={item.product.images[0]?.url}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-xl shadow-sm border border-gray-100"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{item.product.name}</h4>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[10px] text-gray-500">{item.size?.name || '-'} / {item.color?.name || '-'}</span>
                      </div>
                      <p className="text-xs font-bold text-black mt-1">
                        {item.quantity} × {formatPrice(item.price)} {t.rial}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-6 mt-6 border-t font-bold">
                <div className="flex justify-between text-gray-400 text-sm">
                  <span>{t.subtotal}</span>
                  <span className="text-black">{formatPrice(subtotal)} {t.rial}</span>
                </div>
                <div className="flex justify-between text-gray-400 text-sm">
                  <span>{t.shipping}</span>
                  <span className="text-black">
                    {shippingCost > 0 ? `${formatPrice(shippingCost)} ${t.rial}` : t.calculatedAtCheckout}
                  </span>
                </div>
                <div className="flex justify-between text-2xl font-black text-black pt-4 border-t-2 border-gray-100">
                  <span>{t.total}</span>
                  <span className="text-primary-600">{formatPrice(total)} {t.rial}</span>
                </div>
              </div>

              <div className="p-4 bg-gray-900 text-white rounded-2xl flex items-start gap-3">
                <div className="mt-1 flex-shrink-0">🚀</div>
                <p className="text-xs leading-relaxed opacity-90">{t.willContactYou}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
