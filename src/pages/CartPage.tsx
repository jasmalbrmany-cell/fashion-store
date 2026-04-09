import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, MessageCircle, User, LogIn, Flame, Star } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { mockStoreSettings } from '@/data/mockData';
import { productsService } from '@/services';
import { Product } from '@/types';

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, getSubtotal, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { t, language } = useLanguage();
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);

  const subtotal = getSubtotal();
  const currencySymbol = t.rial;

  // جلب المنتجات المقترحة
  useEffect(() => {
    const loadSuggested = async () => {
      const products = await productsService.getAll();
      // إظهار منتجات عشوائية مختلفة عن ما في السلة
      const cartProductIds = items.map(i => i.productId);
      const filtered = products.filter(p => !cartProductIds.includes(p.id));
      setSuggestedProducts(filtered.slice(0, 6));
    };
    loadSuggested();
  }, [items]);

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const handleWhatsAppOrder = () => {
    const itemsList = items
      .map(
        item =>
          `- ${item.product.name}\n  ${t.size}: ${item.size?.name || '-'}\n  ${t.color}: ${item.color?.name || '-'}\n  ${t.quantityLabel}: ${item.quantity}\n  ${t.price}: ${formatPrice(item.price * item.quantity)} ${currencySymbol}`
      )
      .join('\n\n');

    const message = `${t.whatsappOrderTemplate}:\n\n${itemsList}\n\n${t.total}: ${formatPrice(subtotal)} ${currencySymbol}`;

    window.open(
      `https://wa.me/${mockStoreSettings.socialLinks.whatsapp}?text=${encodeURIComponent(message)}`,
      '_blank'
    );
  };

  const formatPrice = (price: number) => price.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US');

  // --- حالة: السلة فارغة ---
  if (items.length === 0) {
    return (
      <div className="min-h-[80vh] bg-gray-50 flex flex-col" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {/* رأس الصفحة */}
        <div className="bg-white border-b px-4 py-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 text-center">{t.cartTitle}</h1>
        </div>

        {/* منطقة السلة الفارغة */}
        <div className="bg-white mx-4 mt-10 rounded-3xl shadow-xl p-12 text-center max-w-2xl md:mx-auto">
          <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center bg-gray-50 rounded-full">
            <ShoppingBag className="w-12 h-12 text-gray-300" strokeWidth={1} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.emptyCart}</h2>
          <p className="text-gray-500 mb-10">
            {isAuthenticated
              ? t.emptyCartNote
              : t.loginToSeeCart}
          </p>

          {/* أزرار تسجيل الدخول / التسوق */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className="px-10 py-4 bg-black text-white rounded-full font-bold text-center hover:bg-gray-800 transition flex items-center justify-center gap-2 shadow-lg"
                >
                  <User className="w-5 h-5" />
                  {t.loginRegister}
                </Link>
                <Link
                  to="/products"
                  className="px-10 py-4 border-2 border-gray-200 text-gray-700 rounded-full font-bold text-center hover:bg-gray-50 transition"
                >
                  {t.shopByCategory}
                </Link>
              </>
            ) : (
              <Link
                to="/products"
                className="px-12 py-4 bg-black text-white rounded-full font-bold hover:bg-gray-800 transition shadow-lg"
              >
                {t.browseProducts}
              </Link>
            )}
          </div>
        </div>

        {/* قسم المنتجات المقترحة */}
        {suggestedProducts.length > 0 && (
          <div className="mt-6 px-4 pb-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-yellow-500">✦</span>
              <h3 className="font-bold text-gray-900">{t.youMightLike}</h3>
              <span className="text-yellow-500">✦</span>
            </div>

            {/* فلاتر */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              <button className="flex-shrink-0 px-4 py-1.5 bg-black text-white rounded-full text-sm font-medium">
                {t.all}
              </button>
              <button className="flex-shrink-0 px-4 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-full text-sm flex items-center gap-1 hover:bg-gray-50">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                {t.mostSold}
              </button>
              <button className="flex-shrink-0 px-4 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-full text-sm flex items-center gap-1 hover:bg-gray-50">
                <Star className="w-3.5 h-3.5 text-yellow-500" />
                {t.topRated}
              </button>
            </div>

            {/* شبكة المنتجات */}
            <div className="grid grid-cols-2 gap-3">
              {suggestedProducts.map(product => (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition group"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={product.images[0]?.url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">{product.name}</p>
                    <p className="text-sm font-bold text-gray-900">
                      {formatPrice(product.price)} {currencySymbol}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- حالة: السلة بها منتجات ---
  return (
    <div className="bg-gray-50 min-h-screen py-8" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">{t.cartTitle}</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* قائمة المنتجات */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-sm p-4 md:p-6">
                <div className="flex gap-4">
                  <Link to={`/product/${item.productId}`} className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0">
                    <img
                      src={item.product.images[0]?.url}
                      alt={item.product.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </Link>

                  <div className="flex-1">
                    <div className="flex justify-between">
                      <Link to={`/product/${item.productId}`} className="font-semibold text-gray-900 hover:text-black">
                        {item.product.name}
                      </Link>
                      <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 transition">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                      {item.size && <span>{t.size}: {item.size.name}</span>}
                      {item.color && (
                        <span className="flex items-center gap-1">
                          {t.color}:
                          <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: item.color.hex }} />
                          {item.color.name}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center border border-gray-300 rounded-lg">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-2 hover:bg-gray-100">
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="px-4 font-medium">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-2 hover:bg-gray-100">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <div>
                        <p className="font-bold text-gray-900">
                          {formatPrice(item.price * item.quantity)} {currencySymbol}
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-sm text-gray-500">{formatPrice(item.price)} {currencySymbol} {t.pricePerItem}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-between items-center bg-white rounded-xl shadow-sm p-4">
              <button onClick={clearCart} className="text-red-600 hover:text-red-700 font-medium">
                {t.clearCart}
              </button>
              <Link to="/products" className="text-gray-700 hover:text-black font-medium flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" />
                {t.continueShopping}
              </Link>
            </div>
          </div>

          {/* ملخص الطلب */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-6">{t.orderSummary}</h2>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t.products} ({items.length})</span>
                  <span className="font-medium">{formatPrice(subtotal)} {currencySymbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t.shipping}</span>
                  <span className="text-sm text-gray-500">{t.calculatedAtCheckout}</span>
                </div>
                <hr />
                <div className="flex justify-between text-lg font-bold">
                  <span>{t.total}</span>
                  <span>{formatPrice(subtotal)} {currencySymbol}</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={handleCheckout}
                  className="w-full py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition"
                >
                  {t.completeOrder}
                </button>
                <button
                  onClick={handleWhatsAppOrder}
                  className="w-full py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  {t.whatsappOrder}
                </button>
              </div>

              <p className="mt-4 text-sm text-gray-500 text-center">
                {t.whatsappConfirmNote}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
