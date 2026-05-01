import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Loader2, Shirt, Watch, ShoppingBag, Sparkles, Footprints, Crown, Star, Diamond, Glasses } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductCard } from '@/components/Product';
import { productsService, categoriesService, adsService, storeSettingsService } from '@/services/api';
import { useLanguage, categoryNames, translateCategory, translateText } from '@/context/LanguageContext';
import { Skeleton } from '@/components/Common/Skeleton';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import type { Product, Category, Ad, StoreSettings } from '@/types';

const HomePage: React.FC = () => {
  const [currentBanner, setCurrentBanner] = useState(0);
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);

  const isAr = language === 'ar';

  const getCategoryIcon = (index: number) => {
    const icons = [Crown, Shirt, Footprints, Watch, ShoppingBag, Sparkles, Diamond, Glasses, Star];
    const Icon = icons[index % icons.length];
    return <Icon className="w-10 h-10" strokeWidth={1.5} />;
  };

  useEffect(() => {
    document.title = isAr ? 'فاشن هوب | الرئيسية' : 'Fashion Hub | Home';
  }, [isAr]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Load critical data first to render page frame faster
        const [categoriesData, settingsData] = await Promise.all([
          categoriesService.getAll(),
          storeSettingsService.get()
        ]);
        setCategories(categoriesData);
        setSettings(settingsData);
        setLoading(false);

        // Load heavier data in background to reduce first paint delay
        const [productsData, adsData] = await Promise.all([
          productsService.getAll(),
          adsService.getAll(),
        ]);
        setProducts(productsData);
        setAds(adsData);
      } catch (error) {
        console.error('Failed to fetch homepage data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const activeBanners = ads.filter(ad => ad.isActive && ad.position === 'top');
  const inlineAds = ads.filter(ad => ad.isActive && ad.position === 'inline');

  const nextBanner = () => setCurrentBanner((prev) => (prev + 1) % activeBanners.length);
  const prevBanner = () => setCurrentBanner((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);

  const featuredProducts = products.filter(p => p.isVisible).slice(0, 8);
  const newArrivals = products.filter(p => p.isVisible).slice(0, 4);

  if ((loading && products.length === 0) || settings?.isMaintenanceMode) {
    return (
      <div className="bg-white dark:bg-black min-h-screen flex flex-col items-center justify-center animate-fadeIn text-center p-8">
        <div className="max-w-md w-full space-y-8">
           <div className="relative">
             <div className="w-32 h-32 bg-gray-50 rounded-full mx-auto flex items-center justify-center animate-pulse">
               <Loader2 className="w-16 h-16 text-black animate-spin" />
             </div>
             {settings?.isMaintenanceMode && (
               <div className="absolute -bottom-2 right-1/4 bg-orange-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                 {isAr ? 'تحديث مباشر' : 'Live Update'}
               </div>
             )}
           </div>
           <div>
             <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">
               {settings?.isMaintenanceMode 
                 ? (isAr ? 'جاري تحديث التشكيلة الجديدة...' : 'Updating the new collection...')
                 : (isAr ? 'جاري التحميل...' : 'Loading...')}
             </h2>
             <p className="text-gray-500 font-bold leading-relaxed">
               {settings?.isMaintenanceMode 
                 ? (isAr ? 'لحظات ونعود إليكم بأحدث المنتجات والأسعار المذهلة. شكراً لانتظاركم!' : 'A few moments and we will be back with the latest products and amazing prices. Thank you for waiting!')
                 : (isAr ? 'يرجى الانتظار قليلاً بينما نعد لك أفضل تجربة تسوق.' : 'Please wait a moment while we prepare the best shopping experience for you.')}
             </p>
           </div>
           
           {!settings?.isMaintenanceMode && (
             <section className="container mx-auto px-4 py-8 overflow-hidden">
               <div className="flex gap-4 mb-8">
                 {[1, 2, 3, 4].map(i => <Skeleton key={i} className="w-40 h-10 rounded-full flex-shrink-0" />)}
               </div>
               <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                 {[1, 2].map(i => <div key={i} className="space-y-4">
                   <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
                   <Skeleton className="h-4 w-3/4" />
                 </div>)}
               </div>
             </section>
           )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section - Split Screen / Bento Grid */}
      <section className="relative overflow-hidden bg-zinc-50 dark:bg-zinc-950 pt-8 pb-16 md:pt-16 md:pb-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
            
            {/* Left Content (Text & CTA) */}
            <div className="w-full lg:w-1/2 space-y-8 animate-in slide-in-from-bottom-8 fade-in duration-1000 fill-mode-both relative z-10">
              <h1 className="text-5xl md:text-7xl font-black tracking-tight text-gradient-dark leading-[1.1] md:leading-[1.1] drop-shadow-sm">
                {activeBanners.length > 0 
                  ? translateText(activeBanners[currentBanner].title, language)
                  : (t.welcomeTo + ' ' + (settings?.name || 'Fashion Hub'))}
              </h1>
              
              <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-lg leading-relaxed font-medium">
                {activeBanners.length > 0 
                  ? translateText(activeBanners[currentBanner].content, language)
                  : (isAr ? 'اكتشف أحدث صيحات الموضة والأزياء العصرية مع تشكيلة واسعة وأسعار لا تقبل المنافسة' : 'Discover the latest fashion trends and modern styles with a wide collection and unbeatable prices')}
              </p>
              
              <div className="flex flex-wrap gap-4 pt-4">
                <Link
                  to="/products"
                  className="group flex items-center justify-center gap-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-all duration-300 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] dark:shadow-[0_10px_40px_-10px_rgba(255,255,255,0.3)] border border-transparent hover:border-primary/50 hover:bg-zinc-800"
                >
                  <span className="text-gradient-gold group-hover:text-primary-400 transition-colors">{t.shopNow}</span>
                  <span className="group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform text-primary-400">
                    {isAr ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
                  </span>
                </Link>
              </div>

              {/* Banner Controls (If multiple banners exist) */}
              {activeBanners.length > 1 && (
                <div className="flex items-center gap-4 pt-6">
                  <button onClick={prevBanner} className="p-3 rounded-full border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors">
                    {isAr ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                  </button>
                  <div className="flex gap-2">
                    {activeBanners.map((_, index) => (
                      <button key={index} onClick={() => setCurrentBanner(index)}
                        className={`transition-all h-2.5 rounded-full ${index === currentBanner ? 'w-10 bg-primary' : 'w-2.5 bg-zinc-300 dark:bg-zinc-700'}`}
                      />
                    ))}
                  </div>
                  <button onClick={nextBanner} className="p-3 rounded-full border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors">
                    {isAr ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </button>
                </div>
              )}
            </div>

            {/* Right Content (Bento Grid) */}
            <div className="w-full lg:w-1/2 h-[450px] md:h-[600px] animate-in slide-in-from-bottom-12 fade-in duration-1000 delay-300 fill-mode-both">
              <div className="grid grid-cols-2 grid-rows-2 gap-4 h-full">
                {activeBanners.length > 0 ? (
                  <>
                    <div className="row-span-2 rounded-[2.5rem] overflow-hidden shadow-2xl relative group border border-zinc-200/50 dark:border-zinc-800/50">
                      {activeBanners[currentBanner].type === 'video' ? (
                        <video src={activeBanners[currentBanner].videoUrl || activeBanners[currentBanner].imageUrl} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" autoPlay muted loop playsInline />
                      ) : (
                        <LazyLoadImage 
                          src={activeBanners[currentBanner].imageUrl} 
                          alt="Main Banner" 
                          effect="blur"
                          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" 
                          wrapperClassName="w-full h-full"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-zinc-900/20 to-transparent mix-blend-multiply"></div>
                      <div className="absolute inset-0 border-[1px] border-white/10 rounded-[2.5rem] pointer-events-none"></div>
                    </div>
                    
                    <div className="rounded-[2rem] overflow-hidden shadow-xl relative group bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50">
                      {activeBanners.length > 1 ? (
                        <LazyLoadImage 
                          src={activeBanners[(currentBanner + 1) % activeBanners.length].imageUrl} 
                          alt="Secondary Banner" 
                          effect="blur"
                          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 opacity-90 saturate-50 group-hover:saturate-100" 
                          wrapperClassName="w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900">
                          <Crown className="w-16 h-16 text-primary-400 opacity-50" />
                        </div>
                      )}
                    </div>
                    
                    <div className="rounded-[2rem] overflow-hidden shadow-xl relative group bg-gradient-to-br from-zinc-900 to-black dark:from-zinc-950 dark:to-zinc-900 flex justify-center items-center border border-zinc-800">
                       <Sparkles className="w-32 h-32 text-primary-500/20 absolute -right-8 -top-8 animate-pulse" />
                       <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
                       <h3 className="text-gradient-gold font-black text-2xl z-10 text-center px-4 leading-tight max-w-[150px]">
                         {isAr ? 'عروض حصرية' : 'Exclusive Deals'}
                       </h3>
                    </div>
                  </>
                ) : (
                  <div className="col-span-2 row-span-2 rounded-[3rem] overflow-hidden shadow-2xl relative bg-zinc-950 flex items-center justify-center border border-zinc-800">
                    <div className="absolute -top-20 -left-20 w-72 h-72 bg-primary-500/20 blur-[80px] rounded-full mix-blend-screen animate-pulse"></div>
                    <div className="absolute bottom-10 right-10 w-96 h-96 bg-zinc-500/20 blur-[100px] rounded-full mix-blend-screen animate-pulse" style={{ animationDelay: '1s' }}></div>
                    <img src="/logo.jpg" alt="Logo" className="w-32 h-32 md:w-48 md:h-48 object-contain z-10 opacity-50 rounded-full" />
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-3 mb-12">
            <div className="h-px bg-gray-200 flex-1 max-w-[100px]"></div>
            <h2 className="text-3xl font-black text-gray-900 text-center tracking-tight">{t.categories}</h2>
            <div className="h-px bg-gray-200 flex-1 max-w-[100px]"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            <AnimatePresence>
              {categories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  <Link
                    to={`/products?category=${category.id}`}
                    className="group flex flex-col items-center justify-center p-6 bg-transparent hover:bg-gray-50/50 rounded-[2.5rem] transition-all duration-500 relative overflow-hidden"
                  >
                    <div className={`relative w-28 h-28 mb-5 rounded-full flex items-center justify-center transform group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-700 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)]
                      ${[
                        'bg-gradient-to-tr from-zinc-800 to-zinc-950 text-primary-400', 
                        'bg-gradient-to-tr from-primary-400 to-primary-600 text-white', 
                        'bg-gradient-to-tr from-zinc-100 to-zinc-300 dark:from-zinc-800 dark:to-zinc-700 text-zinc-900 dark:text-zinc-100', 
                        'bg-gradient-to-tr from-primary-900 to-black text-primary-300', 
                        'bg-gradient-to-tr from-zinc-300 to-zinc-400 dark:from-zinc-900 dark:to-black text-zinc-800 dark:text-zinc-300', 
                        'bg-gradient-to-tr from-amber-200 to-primary-500 text-zinc-900'
                      ][index % 6]}
                    `}>
                      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full scale-[0.80] group-hover:scale-95 transition-transform duration-700"></div>
                      <span className="relative z-10 transform group-hover:rotate-12 transition-transform duration-500 drop-shadow-md">
                        {getCategoryIcon(index)}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-lg text-zinc-800 dark:text-zinc-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition tracking-tight">
                      {translateCategory(category.id, category.name, language)}
                    </h3>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">{t.featuredProducts}</h2>
            <Link to="/products" className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              {t.viewAll}
              {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Inline Ad Section */}
      {inlineAds.length > 0 && (
        <section className="py-6 bg-white">
          <div className="container mx-auto px-4">
            <div className="rounded-3xl overflow-hidden shadow-xl border border-gray-100 flex justify-center items-center relative min-h-[150px] md:min-h-[250px]">
              {inlineAds[0].imageUrl ? (
                inlineAds[0].type === 'video' ? (
                  <video src={inlineAds[0].videoUrl || inlineAds[0].imageUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                ) : (
                  <LazyLoadImage 
                    src={inlineAds[0].imageUrl} 
                    alt={inlineAds[0].title} 
                    effect="blur"
                    className="w-full h-full object-cover" 
                    wrapperClassName="w-full h-full"
                  />
                )
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-gray-900 to-black text-white p-10 text-center">
                  <h2 className="text-2xl md:text-4xl font-bold mb-4">{inlineAds[0].title}</h2>
                  <p className="text-gray-300">{inlineAds[0].content}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">{t.newArrivals}</h2>
            <Link to="/products?sort=newest" className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              {t.viewAll}
              {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: '🚚', title: t.fastShipping, desc: t.fastShippingDesc },
              { icon: '🔒', title: t.securePay, desc: t.securePayDesc },
              { icon: '↩️', title: t.easyReturn, desc: t.easyReturnDesc },
              { icon: '💬', title: t.support, desc: t.supportDesc },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-3xl">{item.icon}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
