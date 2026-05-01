import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { useLanguage, translateText } from '@/context/LanguageContext';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

interface ProductCardProps {
  product: Product;
  onAddToCart?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const navigate = useNavigate();
  const { addItem, setIsCartOpen } = useCart();
  const { t, language, isRTL } = useLanguage();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
  const secondaryImage = product.images.filter(img => img.id !== primaryImage?.id)[0];

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
    if (setIsCartOpen) setIsCartOpen(true);
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
      className="bg-white dark:bg-zinc-950 rounded-[2rem] border border-transparent hover:border-zinc-200 dark:border-zinc-900 dark:hover:border-zinc-800 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-500 h-full flex flex-col group animate-fadeIn"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <Link to={`/product/${product.id}`} className="block flex-1 flex flex-col relative">
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-zinc-100 dark:bg-zinc-900 rounded-t-[2rem]">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 shimmer"></div>
          )}
          <LazyLoadImage
            src={primaryImage?.url}
            alt={product.name}
            effect="blur"
            wrapperClassName={`w-full h-full object-cover transition-all duration-700 ease-out z-0 ${isHovered && secondaryImage ? 'opacity-0' : 'opacity-100'} ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            className="w-full h-full object-cover"
            afterLoad={() => setImageLoaded(true)}
            placeholder={<div className="absolute inset-0 bg-zinc-200 dark:bg-zinc-800 animate-pulse" />}
            useIntersectionObserver={true}
          />
          {secondaryImage && (
            <LazyLoadImage 
               src={secondaryImage.url}
               alt={`${product.name} - view`}
               effect="blur"
               wrapperClassName={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out z-0 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
               className="w-full h-full object-cover"
               useIntersectionObserver={true}
            />
          )}

          <div className={`absolute top-4 ${isRTL ? 'right-4' : 'left-4'} flex flex-col gap-2.5 z-10`}>
            {product.stock <= 3 && product.stock > 0 && (
              <span className="bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 backdrop-blur-md text-[10px] md:text-xs px-3 py-1.5 rounded-full font-bold shadow-sm">
                {t.onlyLeft.replace('{count}', product.stock.toString())}
              </span>
            )}
          </div>

          {/* Actions - Wishlist */}
          <div className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10`}>
            <button
              onClick={toggleWishlist}
              className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.1)] transition-transform hover:scale-110 active:scale-95 ${
                isWishlisted
                   ? 'bg-rose-500 text-white'
                  : 'bg-white/80 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-300'
              }`}
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Quick Actions Slide-up */}
          <div className={`absolute inset-x-2 bottom-2 p-2 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-lg rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-500 ease-out z-10 ${isHovered ? 'translate-y-0 opacity-100 visible' : 'translate-y-full opacity-0 invisible'}`}>
            <div className="flex gap-2">
              <button
                onClick={handleQuickBuy}
                disabled={product.stock === 0}
                className="flex-1 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold uppercase tracking-wider hover:bg-zinc-700 dark:hover:bg-zinc-100 transition shadow-md active:scale-95 disabled:opacity-50 text-[10px] md:text-xs"
              >
                <span className="text-gradient-gold">{t.buyNow}</span>
              </button>
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="w-10 h-10 shrink-0 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-800 rounded-xl flex items-center justify-center hover:bg-primary-100 dark:hover:bg-primary-900/30 transition shadow-sm active:scale-95 disabled:opacity-50"
              >
                <ShoppingCart className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Info Area */}
        <div className="p-5 flex-1 flex flex-col bg-transparent transition-colors z-20">
          <h3 className="font-bold text-zinc-800 dark:text-zinc-100 mb-2 line-clamp-2 group-hover:text-primary transition-colors text-sm md:text-base leading-relaxed tracking-tight">
            {translateText(product.name, language)}
          </h3>
          <div className="mt-auto pt-2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-baseline gap-1">
                <span className="text-lg md:text-xl font-black text-primary-600 dark:text-primary-400">
                  {formatPrice(product.price)}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium pb-1">
                  {t.rial}
                </span>
              </div>
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
