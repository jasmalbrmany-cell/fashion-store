import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, MessageCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { mockStoreSettings, mockCities } from '@/data/mockData';

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, getSubtotal, clearCart } = useCart();

  const subtotal = getSubtotal();
  const currencySymbol = 'ر.ي';

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const handleWhatsAppOrder = () => {
    const itemsList = items
      .map(
        item =>
          `- ${item.product.name}
  المقاس: ${item.size?.name || '-'}
  اللون: ${item.color?.name || '-'}
  الكمية: ${item.quantity}
  السعر: ${(item.price * item.quantity).toLocaleString('ar-SA')} ${currencySymbol}`
      )
      .join('\n\n');

    const message = `مرحباً! أريد إتمام الطلب التالي:

${itemsList}

الإجمالي: ${subtotal.toLocaleString('ar-SA')} ${currencySymbol}`;

    window.open(
      `https://wa.me/${mockStoreSettings.socialLinks.whatsapp}?text=${encodeURIComponent(message)}`,
      '_blank'
    );
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('ar-SA');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-32 h-32 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <ShoppingBag className="w-16 h-16 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">السلة فارغة</h2>
          <p className="text-gray-500 mb-6">لم تضف أي منتجات للسلة بعد</p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            تصفح المنتجات
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">سلة التسوق</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm p-4 md:p-6">
                <div className="flex gap-4">
                  {/* Image */}
                  <Link to={`/product/${item.productId}`} className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0">
                    <img
                      src={item.product.images[0]?.url}
                      alt={item.product.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </Link>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <Link
                        to={`/product/${item.productId}`}
                        className="font-semibold text-gray-900 hover:text-primary-600"
                      >
                        {item.product.name}
                      </Link>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-gray-400 hover:text-red-500 transition"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Size & Color */}
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                      {item.size && <span>المقاس: {item.size.name}</span>}
                      {item.color && (
                        <span className="flex items-center gap-1">
                          اللون:
                          <span
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: item.color.hex }}
                          />
                          {item.color.name}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      {/* Quantity */}
                      <div className="flex items-center border border-gray-300 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-2 hover:bg-gray-100"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="px-4 font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-2 hover:bg-gray-100"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-left">
                        <p className="font-bold text-primary-600">
                          {formatPrice(item.price * item.quantity)} {currencySymbol}
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-sm text-gray-500">
                            {formatPrice(item.price)} {currencySymbol} للواحد
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Clear Cart */}
            <div className="flex justify-between items-center bg-white rounded-lg shadow-sm p-4">
              <button
                onClick={clearCart}
                className="text-red-600 hover:text-red-700 font-medium"
              >
                إفراغ السلة
              </button>
              <Link
                to="/products"
                className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                متابعة التسوق
              </Link>
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-6">ملخص الطلب</h2>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">المنتجات ({items.length})</span>
                  <span className="font-medium">{formatPrice(subtotal)} {currencySymbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">الشحن</span>
                  <span className="text-sm text-gray-500">يُحسب عند الإتمام</span>
                </div>
                <hr />
                <div className="flex justify-between text-lg font-bold">
                  <span>الإجمالي</span>
                  <span className="text-primary-600">{formatPrice(subtotal)} {currencySymbol}</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={handleCheckout}
                  className="w-full py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition"
                >
                  إتمام الطلب
                </button>
                <button
                  onClick={handleWhatsAppOrder}
                  className="w-full py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  طلب عبر واتساب
                </button>
              </div>

              {/* Note */}
              <p className="mt-4 text-sm text-gray-500 text-center">
                سيتم التواصل معك عبر واتساب لتأكيد الطلب والدفع
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
