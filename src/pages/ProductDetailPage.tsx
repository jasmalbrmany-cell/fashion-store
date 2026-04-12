import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Minus, Plus, Star, Check, ChevronLeft, ChevronRight, Package, Loader2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { productsService, categoriesService } from '@/services/api';
import { Product, ProductSize, ProductColor, Category } from '@/types';
import { useLanguage, categoryNames } from '@/context/LanguageContext';
import { ProductCard } from '@/components/Product';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem, items } = useCart();
  const { t, language, isRTL } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'details'>('description');
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  
  // Custom zoom state
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const foundProduct = await productsService.getById(id);
        if (foundProduct) {
          setProduct(foundProduct);
          if (foundProduct.sizes.length > 0) {
            setSelectedSize(foundProduct.sizes[0]);
          }
          if (foundProduct.colors.length > 0) {
            setSelectedColor(foundProduct.colors[0]);
          }
          
          
          if (foundProduct.categoryId) {
            const cat = await categoriesService.getById(foundProduct.categoryId);
            setCategory(cat);
            
            // Fetch related products
            const allStoreProds = await productsService.getAll();
            const related = allStoreProds
              .filter(p => p.categoryId === foundProduct.categoryId && p.id !== foundProduct.id && p.isVisible)
              .slice(0, 4);
            setRelatedProducts(related);
          }
        }
      } catch (error) {
        console.error('Failed to fetch product details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-black" />
        <p className="text-gray-500 font-medium">{t.loading}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Package className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{t.productNotFound}</h2>
        <button
          onClick={() => navigate('/products')}
          className="px-10 py-3 bg-black text-white rounded-full font-bold hover:bg-gray-800 transition shadow-lg"
        >
          {t.browseProducts}
        </button>
      </div>
    );
  }
  const finalPrice = product.price + (selectedSize?.priceModifier || 0);

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
      alert(t.pleaseSelectSize);
      return;
    }
    if (product.colors.length > 0 && !selectedColor) {
      alert(t.pleaseSelectColor);
      return;
    }
    addItem(product, selectedSize || undefined, selectedColor || undefined, quantity);
  };

  const handleBuyNow = () => {
    if (product.sizes.length > 0 && !selectedSize) {
      alert(t.pleaseSelectSize);
      return;
    }
    if (product.colors.length > 0 && !selectedColor) {
      alert(t.pleaseSelectColor);
      return;
    }
    addItem(product, selectedSize || undefined, selectedColor || undefined, quantity);
    navigate('/checkout');
  };

  const incrementQuantity = () => {
    if (quantity < totalStock) setQuantity(q => q + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) setQuantity(q => q - 1);
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US');
  };

  const BreadcrumbIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <div className="bg-gray-50 min-h-screen py-4 lg:py-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <button onClick={() => navigate('/')} className="hover:text-black whitespace-nowrap">{t.home}</button>
          <BreadcrumbIcon className="w-4 h-4 flex-shrink-0" />
          <button onClick={() => navigate('/products')} className="hover:text-black whitespace-nowrap">{t.products}</button>
          <BreadcrumbIcon className="w-4 h-4 flex-shrink-0" />
          {category && (
            <>
              {/* Show Parent if this is a subcategory */}
              {category.parentId && (
                <>
                  <button 
                    onClick={() => navigate(`/products?category=${category.parentId}`)} 
                    className="hover:text-black whitespace-nowrap opacity-60"
                  >
                    {/* We might need to fetch the parent name or use a cache */}
                    {isRTL ? 'القسم الرئيسي' : 'Parent Category'}
                  </button>
                  <BreadcrumbIcon className="w-4 h-4 flex-shrink-0" />
                </>
              )}
              <button onClick={() => navigate(`/products?category=${category.id}`)} className="hover:text-black whitespace-nowrap font-bold">
                {categoryNames[category.id]?.[language] || category.name}
              </button>
              <BreadcrumbIcon className="w-4 h-4 flex-shrink-0" />
            </>
          )}
          <span className="text-gray-900 font-black whitespace-nowrap truncate max-w-[200px]">{product.name}</span>
        </nav>

        <div className="bg-white rounded-3xl shadow-sm overflow-hidden border">
          <div className="grid lg:grid-cols-2 gap-0">
            {/* Image Gallery */}
            <div className="flex flex-col">
              <div 
                className="relative aspect-square bg-gray-100 overflow-hidden group cursor-zoom-in"
                onMouseMove={(e) => {
                  const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - left) / width) * 100;
                  const y = ((e.clientY - top) / height) * 100;
                  setZoomPos({ x, y });
                }}
              >
                <img
                  src={product.images[selectedImage]?.url}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.7]"
                  style={{ transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` }}
                />
                {product.sourceUrl && (
                  <span className={`absolute top-4 ${isRTL ? 'right-4' : 'left-4'} bg-black text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest`}>
                    {t.imported}
                  </span>
                )}
              </div>

              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="p-4 flex gap-3 overflow-x-auto bg-gray-50/50">
                  {product.images.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setSelectedImage(index)}
                      className={`w-20 h-20 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all ${
                        selectedImage === index ? 'border-black shadow-lg scale-105' : 'border-transparent opacity-60 hover:opacity-100 hover:border-gray-200'
                      }`}
                    >
                      <img src={image.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details Content */}
            <div className="p-6 lg:p-12 flex flex-col">
              <div className="flex-1">
                <div className="mb-8">
                  <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>
                  <div className="flex items-center gap-4">
                    <div className="flex text-yellow-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-5 h-5 ${i < 4 ? 'fill-current' : 'text-gray-200'}`} />
                      ))}
                    </div>
                    <span className="text-gray-500 text-sm">24 {t.reviews}</span>
                  </div>
                </div>

                {/* Price Display */}
                <div className="mb-10">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-black">
                      {formatPrice(finalPrice)}
                    </span>
                    <span className="text-xl font-bold text-gray-900">{t.rial}</span>
                  </div>
                </div>

                {/* Sizes Selection */}
                {product.sizes.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">
                      {t.selectSize}: <span className="text-gray-500 font-medium">{selectedSize?.name || '--'}</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((size) => (
                        <button
                          key={size.id}
                          onClick={() => setSelectedSize(size)}
                          disabled={size.stock === 0}
                          className={`min-w-[60px] h-12 px-4 rounded-xl border-2 font-bold transition-all ${
                            selectedSize?.id === size.id
                              ? 'border-black bg-black text-white shadow-xl translate-y-[-2px]'
                              : size.stock === 0
                              ? 'border-gray-100 text-gray-300 cursor-not-allowed line-through'
                              : 'border-gray-100 hover:border-black text-gray-700'
                          }`}
                        >
                          {size.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Color Selection */}
                {product.colors.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">
                      {t.selectColor}: <span className="text-gray-500 font-medium">{selectedColor?.name || '--'}</span>
                    </h3>
                    <div className="flex flex-wrap gap-4">
                      {product.colors.map((color) => (
                        <button
                          key={color.id}
                          onClick={() => setSelectedColor(color)}
                          className={`w-12 h-12 rounded-full border-2 transition-all flex items-center justify-center ${
                            selectedColor?.id === color.id
                              ? 'border-black ring-4 ring-offset-2 ring-black'
                              : 'border-transparent hover:scale-110'
                          }`}
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        >
                          {selectedColor?.id === color.id && (
                            <Check className={`w-6 h-6 ${color.hex.toLowerCase() === '#ffffff' ? 'text-black' : 'text-white'}`} />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity Adjustment */}
                <div className="mb-10">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">{t.quantityLabel}</h3>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center bg-gray-50 rounded-2xl p-1 border border-gray-100">
                      <button
                        onClick={decrementQuantity}
                        disabled={quantity <= 1}
                        className="w-12 h-12 rounded-xl flex items-center justify-center hover:bg-white hover:shadow-md disabled:opacity-30 transition-all"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                      <span className="w-16 text-center font-black text-xl">{quantity}</span>
                      <button
                        onClick={incrementQuantity}
                        disabled={quantity >= totalStock}
                        className="w-12 h-12 rounded-xl flex items-center justify-center hover:bg-white hover:shadow-md disabled:opacity-30 transition-all"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className={`w-2 h-2 rounded-full ${totalStock > 0 ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                      <span className={totalStock > 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                        {totalStock > 0 ? `${totalStock} ${t.itemsInStock}` : t.outOfOrder}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Execution Actions */}
              <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t">
                <button
                  onClick={handleBuyNow}
                  disabled={totalStock === 0}
                  className="flex-[2] py-5 bg-black text-white rounded-2xl font-black text-lg hover:bg-gray-800 transition-all shadow-xl hover:shadow-black/20 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
                >
                  {t.buyNow}
                </button>
                <button
                  onClick={handleAddToCart}
                  disabled={totalStock === 0 || isInCart}
                  className={`flex-[2] py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all ${
                    isInCart
                      ? 'bg-green-100 text-green-700 border-2 border-green-200'
                      : totalStock === 0
                      ? 'bg-gray-50 text-gray-300 border-2 border-gray-100 cursor-not-allowed'
                      : 'bg-white text-black border-2 border-black hover:bg-black hover:text-white'
                  }`}
                >
                  {isInCart ? (
                    <><Check className="w-6 h-6" /> {t.inCart}</>
                  ) : (
                    <><ShoppingCart className="w-6 h-6" /> {t.addToCart}</>
                  )}
                </button>
                <button
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className={`flex-1 py-5 rounded-2xl border-2 flex items-center justify-center transition-all ${
                    isWishlisted ? 'bg-red-50 border-red-100 text-red-500' : 'border-gray-100 text-gray-400 hover:border-red-200 hover:text-red-300'
                  }`}
                >
                  <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Expanded Details & Tabs */}
          <div className="bg-gray-50/50 border-t">
            <div className={`flex border-b overflow-x-auto scrollbar-hide`}>
              <button
                onClick={() => setActiveTab('description')}
                className={`flex-1 min-w-[150px] py-6 font-black text-sm uppercase tracking-widest transition-all ${
                  activeTab === 'description' ? 'text-black bg-white' : 'text-gray-400 hover:text-black'
                }`}
              >
                {t.description}
              </button>
              <button
                onClick={() => setActiveTab('details')}
                className={`flex-1 min-w-[150px] py-6 font-black text-sm uppercase tracking-widest transition-all ${
                  activeTab === 'details' ? 'text-black bg-white' : 'text-gray-400 hover:text-black'
                }`}
              >
                {t.additionalDetails}
              </button>
            </div>
            <div className="p-8 lg:p-12">
              {activeTab === 'description' ? (
                <p className="text-gray-600 text-lg leading-relaxed max-w-4xl">{product.description}</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-8 max-w-4xl">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-gray-400 text-xs font-bold uppercase mb-1">{t.categoryLabel}</p>
                    <p className="text-black font-bold uppercase">{categoryNames[category?.id || '']?.[language] || category?.name}</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-gray-400 text-xs font-bold uppercase mb-1">{t.availableSizes}</p>
                    <p className="text-black font-bold">{product.sizes.map(s => s.name).join(', ')}</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-gray-400 text-xs font-bold uppercase mb-1">{t.availableColors}</p>
                    <p className="text-black font-bold">{product.colors.map(c => c.name).join(', ')}</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-gray-400 text-xs font-bold uppercase mb-1">{t.dateAdded}</p>
                    <p className="text-black font-bold">{new Date(product.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-3">
               <div className="w-8 h-1 bg-black rounded-full block"></div>
               {isRTL ? 'قد يعجبك أيضاً' : 'You might also like'}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map(prod => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProductDetailPage;
