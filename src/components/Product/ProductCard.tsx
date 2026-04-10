import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';

interface ProductCardProps {
  product: Product;
  onAddToCart?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { t, language, isRTL } = useLanguage();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const defaultSize = product.sizes[0];
    const defaultColor = product.colors[0];
    addItem(product, defaultSize, defaultColor, 1);

    if (onAddToCart) {
      onAddToCart();
    }
  };

  const handleQuickBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const defaultSize = product.sizes[0];
    const defaultColor = product.colors[0];
    addItem(product, defaultSize, defaultColor, 1);
    navigate('/cart');
  };

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US');
  };

  return (
    <div
      className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm overflow-hidden hover:shadow-2xl transition-all duration-500 h-full flex flex-col group animate-fadeIn"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <Link to={`/product/${product.id}`} className="block flex-1 flex flex-col">
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-gray-800">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 shimmer">
            </div>
          )}
          <img
            src={primaryImage?.url}
            alt={product.name}
            loading="lazy"
            className={`w-full h-full object-cover transition-transform duration-700 ease-out ${isHovered ? 'scale-110' : 'scale-100'} ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
          />

          {/* Badges */}
          <div className={`absolute top-3 ${isRTL ? 'right-3' : 'left-3'} flex flex-col gap-2`}>
            {product.sourceUrl && (
              <span className="bg-black/80 dark:bg-white/80 dark:text-black backdrop-blur-md text-white text-[10px] md:text-sm px-3 py-1.5 rounded-full font-black uppercase tracking-widest animate-fadeIn">
                {t.imported}
              </span>
            )}
            {product.stock <= 3 && product.stock > 0 && (
              <span className="bg-red-500 text-white text-[10px] md:text-sm px-3 py-1.5 rounded-full font-black animate-fadeIn">
                {t.onlyLeft.replace('{count}', product.stock.toString())}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className={`absolute top-3 ${isRTL ? 'left-3' : 'right-3'} flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
            <button
              onClick={toggleWishlist}
              className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md shadow-lg transition-all duration-300 hover:scale-110 ${
                isWishlisted
                   ? 'bg-red-500 text-white'
                  : 'bg-white/90 dark:bg-gray-800/90 text-gray-600 dark:text-gray-300'
              }`}
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Quick Actions Overlay */}
          <div className={`absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-all duration-500 ease-out ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <div className="flex gap-2">
              <button
                onClick={handleQuickBuy}
                disabled={product.stock === 0}
                className="flex-1 py-3 bg-white text-black rounded-xl font-black uppercase tracking-widest hover:bg-gray-100 transition shadow-xl active:scale-95 disabled:opacity-50 text-[10px] sm:text-xs"
              >
                {t.buyNow}
              </button>
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="w-12 h-12 bg-white/20 backdrop-blur-md text-white rounded-xl flex items-center justify-center hover:bg-white hover:text-black transition shadow-xl active:scale-95 disabled:opacity-50"
              >
                <ShoppingCart className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 flex-1 flex flex-col dark:bg-gray-900 transition-colors">
          <h3 className="font-black text-gray-900 dark:text-white mb-2 line-clamp-2 hover:text-primary-600 transition text-sm leading-snug flex-1 uppercase tracking-tight">
            {product.name}
          </h3>
          <div className="mt-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-base sm:text-lg font-bold text-black">
                {formatPrice(product.price)} {t.rial}
              </span>
              {/* Color Options */}
              {product.colors.length > 0 && (
                <div className="flex gap-1">
                  {product.colors.slice(0, 3).map((color) => (
                    <div
                      key={color.id}
                      className="w-3.5 h-3.5 rounded-full border border-gray-200"
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                  {product.colors.length > 3 && (
                    <span className="text-[10px] text-gray-400">+{product.colors.length - 3}</span>
                  )}
                </div>
              )}
            </div>
            {/* Sizes */}
            {product.sizes.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {product.sizes.slice(0, 4).map((size) => (
                  <span
                    key={size.id}
                    className={`text-[10px] px-1.5 py-0.5 rounded border ${
                      size.stock > 0 ? 'bg-gray-50 border-gray-100 text-gray-600' : 'bg-gray-50 border-gray-100 text-gray-300 line-through'
                    }`}
                  >
                    {size.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
