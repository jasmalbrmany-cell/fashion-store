import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, X, MessageCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';
import { mockStoreSettings } from '@/data/mockData';

const CartDrawer: React.FC = () => {
  const navigate = useNavigate();
  const { isCartOpen, setIsCartOpen, items, updateQuantity, removeItem, getSubtotal } = useCart();
  const { t, language, isRTL } = useLanguage();

  const subtotal = getSubtotal();
  const currencySymbol = t.rial;

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  const formatPrice = (price: number) => price.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US');

  if (!isCartOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity animate-in fade-in"
        onClick={() => setIsCartOpen(false)}
      />
      <div 
        className={`fixed top-0 bottom-0 ${isRTL ? 'left-0' : 'right-0'} w-full sm:w-[400px] md:w-[450px] bg-white dark:bg-zinc-950 z-[110] shadow-2xl flex flex-col transform transition-transform duration-500 ease-in-out animate-in ${isRTL ? 'slide-in-from-left-full' : 'slide-in-from-right-full'}`}
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
             <ShoppingBag className="w-6 h-6 text-primary" />
             <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-wider">{t.cartTitle}</h2>
             <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">{items.length}</span>
          </div>
          <button 
            onClick={() => setIsCartOpen(false)} 
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-70">
              <div className="w-24 h-24 bg-zinc-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-6">
                <ShoppingBag className="w-10 h-10 text-zinc-300 dark:text-zinc-700" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">{t.emptyCart}</h3>
              <button 
                onClick={() => { setIsCartOpen(false); navigate('/products'); }} 
                className="mt-8 px-8 py-3 bg-primary text-white rounded-full font-bold hover:bg-primary-600 transition"
              >
                {t.browseProducts}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 group">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 flex-shrink-0 relative">
                     <img src={item.product.images[0]?.url} alt={item.product.name} className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div className="flex justify-between items-start gap-2">
                       <div>
                         <h4 className="font-bold text-zinc-900 dark:text-white text-sm line-clamp-2 leading-snug">{item.product.name}</h4>
                         <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500 font-medium tracking-wide">
                            {item.size && <span>{item.size.name}</span>}
                            {item.size && item.color && <span>|</span>}
                            {item.color && <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full border border-zinc-200" style={{ backgroundColor: item.color.hex }} /> {item.color.name}</span>}
                         </div>
                       </div>
                       <button onClick={() => removeItem(item.id)} className="text-zinc-400 hover:text-rose-500 transition-colors p-1">
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                    
                    <div className="flex items-end justify-between mt-4">
                       <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900 rounded-full px-2 py-1 border border-zinc-200 dark:border-zinc-800">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 rounded-full flex items-center justify-center bg-white dark:bg-zinc-800 shadow-sm hover:scale-105 transition-transform"><Minus className="w-3 h-3" /></button>
                          <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 rounded-full flex items-center justify-center bg-white dark:bg-zinc-800 shadow-sm hover:scale-105 transition-transform"><Plus className="w-3 h-3" /></button>
                       </div>
                       <div className="text-right">
                          <p className="font-black text-lg text-zinc-900 dark:text-white leading-none">{formatPrice(item.price * item.quantity)} <span className="text-xs text-zinc-500">{currencySymbol}</span></p>
                       </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex justify-between items-center mb-6">
               <span className="font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest text-sm">{t.total}</span>
               <span className="text-2xl font-black text-zinc-900 dark:text-white flex items-baseline gap-1">
                 {formatPrice(subtotal)} <span className="text-sm text-zinc-500 font-medium">{currencySymbol}</span>
               </span>
            </div>
            
            <button 
              onClick={handleCheckout}
              className="w-full py-4 bg-primary text-white rounded-[1.5rem] font-bold text-lg hover:bg-primary-600 transition shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group mb-3"
            >
              {t.completeOrder}
              <span className="group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform">
                {isRTL ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
              </span>
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
