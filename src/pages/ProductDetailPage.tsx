import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Minus, Plus, Star, Check, ChevronLeft, Package } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { mockProducts, mockCategories } from '@/data/mockData';
import { Product, ProductSize, ProductColor } from '@/types';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem, items } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'details'>('description');

  useEffect(() => {
    const foundProduct = mockProducts.find(p => p.id === id);
    if (foundProduct) {
      setProduct(foundProduct);
      if (foundProduct.sizes.length > 0) {
        setSelectedSize(foundProduct.sizes[0]);
      }
      if (foundProduct.colors.length > 0) {
        setSelectedColor(foundProduct.colors[0]);
      }
    }
  }, [id]);

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">المنتج غير موجود</h2>
        <button
          onClick={() => navigate('/products')}
          className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
        >
          تصفح المنتجات
        </button>
      </div>
    );
  }

  const category = mockCategories.find(c => c.id === product.categoryId);
  const finalPrice = product.price + (selectedSize?.priceModifier || 0);
  const currencySymbol = 'ر.ي';

  const totalStock = selectedSize && selectedColor
    ? product.sizes.find(s => s.id === selectedSize.id)?.stock || 0
    : product.stock;

  const isInCart = items.some(
    item =>
      item.productId === product.id &&
      item.size?.id === selectedSize?.id &&
      item.color?.id === selectedColor?.id
  );

  const handleAddToCart = () => {
    if (product.sizes.length > 0 && !selectedSize) {
      alert('يرجى اختيار المقاس');
      return;
    }
    if (product.colors.length > 0 && !selectedColor) {
      alert('يرجى اختيار اللون');
      return;
    }
    addItem(product, selectedSize || undefined, selectedColor || undefined, quantity);
  };

  const handleBuyNow = () => {
    if (product.sizes.length > 0 && !selectedSize) {
      alert('يرجى اختيار المقاس');
      return;
    }
    if (product.colors.length > 0 && !selectedColor) {
      alert('يرجى اختيار اللون');
      return;
    }
    addItem(product, selectedSize || undefined, selectedColor || undefined, quantity);
    navigate('/checkout');
  };

  const incrementQuantity = () => {
    if (quantity < totalStock) {
      setQuantity(q => q + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(q => q - 1);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('ar-SA');
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6 overflow-x-auto">
          <button onClick={() => navigate('/')} className="hover:text-black whitespace-nowrap">الرئيسية</button>
          <ChevronLeft className="w-4 h-4 flex-shrink-0" />
          <button onClick={() => navigate('/products')} className="hover:text-black whitespace-nowrap">المنتجات</button>
          <ChevronLeft className="w-4 h-4 flex-shrink-0" />
          {category && (
            <>
              <button onClick={() => navigate(`/products?category=${category.id}`)} className="hover:text-black whitespace-nowrap">
                {category.name}
              </button>
              <ChevronLeft className="w-4 h-4 flex-shrink-0" />
            </>
          )}
          <span className="text-gray-900 whitespace-nowrap">{product.name}</span>
        </nav>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-0">
            {/* Images - Full Width on Mobile */}
            <div className="relative bg-gray-100">
              {/* Main Image - Full Width */}
              <div className="relative aspect-square lg:aspect-auto lg:h-full min-h-[400px]">
                <img
                  src={product.images[selectedImage]?.url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {product.sourceUrl && (
                  <span className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm text-white text-sm px-4 py-1.5 rounded-full">
                    مستورد
                  </span>
                )}
              </div>

              {/* Thumbnails - Below Image on Mobile */}
              {product.images.length > 1 && (
                <div className="p-4 flex gap-2 overflow-x-auto bg-white lg:hidden">
                  {product.images.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setSelectedImage(index)}
                      className={`w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition ${
                        selectedImage === index ? 'border-black' : 'border-gray-200'
                      }`}
                    >
                      <img src={image.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="p-6 lg:p-10 flex flex-col">
              <div className="flex-1">
                <div className="mb-6">
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">{product.name}</h1>
                  <div className="flex items-center gap-3">
                    <div className="flex text-yellow-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-5 h-5 ${i < 4 ? 'fill-current' : ''}`} />
                      ))}
                    </div>
                    <span className="text-gray-500 text-sm">(24 تقييم)</span>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-8">
                  <span className="text-4xl font-bold text-black">
                    {formatPrice(finalPrice)}
                  </span>
                  <span className="text-lg text-gray-500 mr-1">{currencySymbol}</span>
                  {selectedSize?.priceModifier && selectedSize.priceModifier > 0 && (
                    <span className="text-gray-400 line-through mr-3 mr-2">
                      {formatPrice(product.price)} {currencySymbol}
                    </span>
                  )}
                </div>

                {/* Sizes */}
                {product.sizes.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      المقاس:
                      <span className="font-normal text-gray-600">
                        {selectedSize?.name || 'اختر المقاس'}
                      </span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((size) => (
                        <button
                          key={size.id}
                          onClick={() => setSelectedSize(size)}
                          disabled={size.stock === 0}
                          className={`px-5 py-2.5 rounded-xl border-2 font-medium transition-all ${
                            selectedSize?.id === size.id
                              ? 'border-black bg-black text-white'
                              : size.stock === 0
                              ? 'border-gray-200 text-gray-300 cursor-not-allowed line-through'
                              : 'border-gray-200 hover:border-gray-400 text-gray-700'
                          }`}
                        >
                          {size.name}
                          {size.stock > 0 && size.stock <= 3 && (
                            <span className="text-xs mr-1 opacity-70">({size.stock})</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Colors */}
                {product.colors.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      اللون:
                      <span className="font-normal text-gray-600">
                        {selectedColor?.name || 'اختر اللون'}
                      </span>
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {product.colors.map((color) => (
                        <button
                          key={color.id}
                          onClick={() => setSelectedColor(color)}
                          className={`w-12 h-12 rounded-full border-3 transition-all ${
                            selectedColor?.id === color.id
                              ? 'border-black ring-2 ring-offset-2 ring-black'
                              : 'border-gray-200 hover:border-gray-400'
                          }`}
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        >
                          {selectedColor?.id === color.id && (
                            <Check className={`w-6 h-6 mx-auto ${color.hex === '#FFFFFF' || color.hex === '#ffffff' ? 'text-black' : 'text-white'}`} />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div className="mb-8">
                  <h3 className="font-semibold text-gray-900 mb-3">الكمية</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={decrementQuantity}
                        disabled={quantity <= 1}
                        className="p-3 hover:bg-gray-100 disabled:opacity-50 transition"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                      <span className="px-6 py-2.5 font-semibold text-lg">{quantity}</span>
                      <button
                        onClick={incrementQuantity}
                        disabled={quantity >= totalStock}
                        className="p-3 hover:bg-gray-100 disabled:opacity-50 transition"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                    <span className="text-gray-500 flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      {totalStock > 0 ? `${totalStock} متوفر` : 'غير متوفر'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                <button
                  onClick={handleBuyNow}
                  disabled={totalStock === 0}
                  className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all ${
                    totalStock === 0
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-black text-white hover:bg-gray-800'
                  }`}
                >
                  شراء الآن
                </button>
                <button
                  onClick={handleAddToCart}
                  disabled={totalStock === 0 || isInCart}
                  className={`flex-1 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                    isInCart
                      ? 'bg-green-100 text-green-700 border-2 border-green-300'
                      : totalStock === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-black border-2 border-black hover:bg-gray-50'
                  }`}
                >
                  {isInCart ? (
                    <>
                      <Check className="w-6 h-6" />
                      في السلة
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-6 h-6" />
                      أضف للسلة
                    </>
                  )}
                </button>
                <button
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    isWishlisted
                      ? 'border-red-500 bg-red-50 text-red-500'
                      : 'border-gray-200 hover:border-red-300 text-gray-400'
                  }`}
                >
                  <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Source Link */}
              {product.sourceUrl && (
                <div className="mt-4 pt-4 border-t">
                  <a
                    href={product.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-500 hover:text-black transition"
                  >
                    المصدر: {product.sourceUrl.length > 50 ? product.sourceUrl.substring(0, 50) + '...' : product.sourceUrl}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Thumbnails - Desktop Side */}
          {product.images.length > 1 && (
            <div className="hidden lg:flex gap-3 p-4 bg-gray-50 border-t">
              {product.images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImage(index)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                    selectedImage === index ? 'border-black' : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <img src={image.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div className="border-t">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('description')}
                className={`px-8 py-4 font-semibold transition ${
                  activeTab === 'description'
                    ? 'text-black border-b-2 border-black'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                الوصف
              </button>
              <button
                onClick={() => setActiveTab('details')}
                className={`px-8 py-4 font-semibold transition ${
                  activeTab === 'details'
                    ? 'text-black border-b-2 border-black'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                تفاصيل إضافية
              </button>
            </div>
            <div className="p-6 lg:p-8">
              {activeTab === 'description' ? (
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed text-lg">{product.description}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between py-3 border-b">
                    <span className="text-gray-500">الفئة</span>
                    <span className="font-medium">{category?.name}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b">
                    <span className="text-gray-500">المقاسات المتاحة</span>
                    <span className="font-medium">{product.sizes.map(s => s.name).join(', ')}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b">
                    <span className="text-gray-500">الألوان المتاحة</span>
                    <span className="font-medium">{product.colors.map(c => c.name).join(', ')}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b">
                    <span className="text-gray-500">تاريخ الإضافة</span>
                    <span className="font-medium">{new Date(product.createdAt).toLocaleDateString('ar-SA')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
