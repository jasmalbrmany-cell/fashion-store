import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Eye } from 'lucide-react';
import { Product } from '@/types';
import { useCart } from '@/context/CartContext';
import { mockStoreSettings } from '@/data/mockData';

interface ProductCardProps {
  product: Product;
  onAddToCart?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
  const currencySymbol = 'ر.ي';

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
    return price.toLocaleString('ar-SA');
  };

  return (
    <div
      className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/product/${product.id}`} className="block">
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="w-8 h-8 border-3 border-black border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <img
            src={primaryImage?.url}
            alt={product.name}
            className={`w-full h-full object-cover transition-transform duration-500 ${isHovered ? 'scale-105' : ''} ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
          />

          {/* Badges */}
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            {product.sourceUrl && (
              <span className="bg-black/80 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">
                مستورد
              </span>
            )}
            {product.stock <= 3 && product.stock > 0 && (
              <span className="bg-red-500 text-white text-xs px-2.5 py-1 rounded-full font-medium">
               只剩 {product.stock}
              </span>
            )}
            {product.stock === 0 && (
              <span className="bg-gray-800 text-white text-xs px-2.5 py-1 rounded-full">
               نفدت
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            <button
              onClick={toggleWishlist}
              className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm shadow-lg transition-all duration-200 ${
                isWishlisted
                  ? 'bg-red-500 text-white'
                  : 'bg-white/90 text-gray-600 hover:bg-red-50'
              }`}
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Quick Actions Overlay */}
          <div className={`absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex gap-2">
              <button
                onClick={handleQuickBuy}
                disabled={product.stock === 0}
                className="flex-1 py-2.5 bg-white text-black rounded-lg font-semibold hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                شراء الآن
              </button>
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="w-12 h-10 bg-white/90 rounded-lg flex items-center justify-center hover:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-black transition text-sm leading-snug">
            {product.name}
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-black">
              {formatPrice(product.price)} {currencySymbol}
            </span>
            {/* Color Options */}
            {product.colors.length > 0 && (
              <div className="flex gap-1.5">
                {product.colors.slice(0, 3).map((color) => (
                  <div
                    key={color.id}
                    className="w-4 h-4 rounded-full border-2 border-gray-200"
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
                {product.colors.length > 3 && (
                  <span className="text-xs text-gray-400">+{product.colors.length - 3}</span>
                )}
              </div>
            )}
          </div>
          {/* Sizes */}
          {product.sizes.length > 0 && (
            <div className="mt-2 flex gap-1 flex-wrap">
              {product.sizes.slice(0, 4).map((size) => (
                <span
                  key={size.id}
                  className={`text-xs px-1.5 py-0.5 rounded ${
                    size.stock > 0 ? 'bg-gray-100 text-gray-600' : 'bg-gray-100 text-gray-300 line-through'
                  }`}
                >
                  {size.name}
                </span>
              ))}
              {product.sizes.length > 4 && (
                <span className="text-xs text-gray-400">+{product.sizes.length - 4}</span>
              )}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
