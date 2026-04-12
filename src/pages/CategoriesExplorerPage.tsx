import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, Loader2, ArrowRight, ShoppingBag } from 'lucide-react';
import { categoriesService, getCachedSync } from '@/services/api';
import { Category } from '@/types';
import { useLanguage, translateCategory } from '@/context/LanguageContext';

const CategoriesExplorerPage: React.FC = () => {
  const navigate = useNavigate();
  const { isRTL, language, t } = useLanguage();
  
  const [categories, setCategories] = useState<Category[]>(getCachedSync<Category[]>('categories_all') || []);
  const [isLoading, setIsLoading] = useState(categories.length === 0);
  const [activeParentId, setActiveParentId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await categoriesService.getAll();
        setCategories(data);
        if (data.length > 0 && !activeParentId) {
          const firstParent = data.find(c => !c.parentId);
          if (firstParent) setActiveParentId(firstParent.id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [activeParentId]);

  const parentCategories = categories.filter(c => !c.parentId);
  const activeChildren = categories.filter(c => c.parentId === activeParentId);
  const activeParent = parentCategories.find(p => p.id === activeParentId);

  // Icon emoji helper (same as header)
  const iconEmoji: Record<string, string> = {
    Shirt: '👕', Footprints: '👟', Watch: '⌚', Briefcase: '💼',
    Flower: '🌸', Baby: '👶', Gem: '💎', Sun: '☀️', Snowflake: '❄️',
    Crown: '👑', Star: '⭐', Heart: '❤️', ShoppingBag: '🛍️', Glasses: '👓',
    Layers: '📚', Tag: '🏷️', Zap: '⚡', Package: '📦'
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <Loader2 className="w-10 h-10 animate-spin text-black dark:text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Search Header */}
      <div className="p-4 border-b dark:border-zinc-800 sticky top-0 bg-white dark:bg-black z-20">
        <div className="relative">
          <input
            type="text"
            readOnly
            onClick={() => navigate('/products')}
            placeholder={t.searchPlaceholder}
            className="w-full px-12 py-3 bg-gray-100 dark:bg-zinc-900 rounded-2xl outline-none font-bold text-sm"
          />
          <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400`} />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Parent Categories */}
        <div className={`w-28 sm:w-32 bg-gray-50 dark:bg-zinc-950 border-e dark:border-zinc-800 overflow-y-auto no-scrollbar`}>
          {parentCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveParentId(cat.id)}
              className={`w-full py-6 px-2 flex flex-col items-center gap-2 transition-all relative ${
                activeParentId === cat.id 
                ? 'bg-white dark:bg-black text-black dark:text-white' 
                : 'text-gray-400 dark:text-zinc-600'
              }`}
            >
              <span className={`text-2xl transition-transform duration-300 ${activeParentId === cat.id ? 'scale-125' : ''}`}>
                {iconEmoji[cat.icon || ''] || '📁'}
              </span>
              <span className={`text-[10px] font-black text-center leading-tight uppercase tracking-tighter ${activeParentId === cat.id ? 'opacity-100' : 'opacity-60'}`}>
                {translateCategory(cat.id, cat.name, language)}
              </span>
              
              {activeParentId === cat.id && (
                <div className={`absolute top-0 bottom-0 ${isRTL ? 'right-0' : 'left-0'} w-1 bg-black dark:bg-white rounded-full`} />
              )}
            </button>
          ))}
        </div>

        {/* Content - Subcategories */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-white dark:bg-black no-scrollbar">
          {activeParent && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Promo Banner / Featured */}
              <div 
                className="relative h-28 bg-gradient-to-br from-zinc-900 to-black rounded-3xl p-6 flex flex-col justify-center overflow-hidden cursor-pointer active:scale-95 transition-transform"
                onClick={() => navigate(`/products?category=${activeParent.id}`)}
              >
                 <div className="absolute right-0 top-0 opacity-10 blur-xl w-32 h-32 bg-white rounded-full"></div>
                 <h3 className="text-white font-black text-xl mb-1">{translateCategory(activeParent.id, activeParent.name, language)}</h3>
                 <div className="flex items-center gap-2 text-white/60 text-[10px] font-bold uppercase tracking-widest">
                    <span>{isRTL ? 'عرض الكل' : 'View All'}</span>
                    <ArrowRight className="w-3 h-3" />
                 </div>
                 <span className="absolute left-6 top-1/2 -translate-y-1/2 text-5xl opacity-20 pointer-events-none">
                    {iconEmoji[activeParent.icon || ''] || '📁'}
                 </span>
              </div>

              {/* Subcategories Grid */}
              <div className="space-y-6 pb-20">
                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {activeChildren.map(child => (
                      <div 
                        key={child.id}
                        onClick={() => navigate(`/products?category=${child.id}`)}
                        className="flex flex-col items-center gap-3 active:scale-95 transition-all group"
                      >
                         <div className="aspect-square w-full bg-gray-50 dark:bg-zinc-900 rounded-3xl flex items-center justify-center text-4xl shadow-sm border border-gray-100 dark:border-zinc-800 group-hover:bg-white dark:group-hover:bg-zinc-800 transition-colors">
                            {iconEmoji[child.icon || ''] || '•'}
                         </div>
                         <span className="text-[11px] font-black text-gray-900 dark:text-zinc-200 text-center uppercase tracking-tight">
                            {translateCategory(child.id, child.name, language)}
                         </span>
                      </div>
                    ))}

                    {/* All Products in this category button */}
                    <div 
                       onClick={() => navigate(`/products?category=${activeParent.id}`)}
                       className="flex flex-col items-center gap-3 active:scale-95 transition-all group"
                    >
                        <div className="aspect-square w-full bg-black text-white rounded-3xl flex items-center justify-center text-xl shadow-xl shadow-black/10">
                           <ShoppingBag className="w-8 h-8" />
                        </div>
                        <span className="text-[11px] font-black text-black dark:text-white text-center uppercase tracking-tight">
                           {isRTL ? 'تسوق الكل' : 'Shop All'}
                        </span>
                    </div>
                 </div>

                 {activeChildren.length === 0 && (
                   <div className="text-center py-20 opacity-30 flex flex-col items-center gap-4">
                      <ShoppingBag className="w-12 h-12" />
                      <p className="font-bold text-sm tracking-widest uppercase">
                        {isRTL ? 'لا توجد أقسام فرعية' : 'No sub-categories'}
                      </p>
                   </div>
                 )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoriesExplorerPage;
