import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard } from '@/components/Product';
import { mockProducts, mockCategories, mockAds, mockStoreSettings } from '@/data/mockData';

const HomePage: React.FC = () => {
  const [currentBanner, setCurrentBanner] = useState(0);

  // Filter active ads
  const activeBanners = mockAds.filter(ad => ad.isActive && ad.position === 'top');

  const nextBanner = () => {
    setCurrentBanner((prev) => (prev + 1) % activeBanners.length);
  };

  const prevBanner = () => {
    setCurrentBanner((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const featuredProducts = mockProducts.filter(p => p.isVisible).slice(0, 8);
  const newArrivals = mockProducts.filter(p => p.isVisible).slice(0, 4);

  return (
    <div>
      {/* Hero Banner Carousel */}
      <section className="relative bg-gray-100">
        <div className="container mx-auto px-4 py-8">
          {activeBanners.length > 0 ? (
            <div className="relative h-64 md:h-96 rounded-xl overflow-hidden">
              <img
                src={activeBanners[currentBanner].imageUrl}
                alt={activeBanners[currentBanner].title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                <div className="p-6 md:p-10 text-white">
                  <h1 className="text-2xl md:text-4xl font-bold mb-2">
                    {activeBanners[currentBanner].title}
                  </h1>
                  <p className="text-lg md:text-xl opacity-90 mb-4">
                    {activeBanners[currentBanner].content}
                  </p>
                  <Link
                    to="/products"
                    className="inline-flex items-center gap-2 bg-white text-primary-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
                  >
                    تسوق الآن
                    <ArrowLeft className="w-5 h-5" />
                  </Link>
                </div>
              </div>

              {/* Navigation Arrows */}
              {activeBanners.length > 1 && (
                <>
                  <button
                    onClick={prevBanner}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextBanner}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>

                  {/* Dots */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {activeBanners.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentBanner(index)}
                        className={`w-3 h-3 rounded-full transition ${
                          index === currentBanner ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="h-64 md:h-96 bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl flex items-center justify-center text-white">
              <div className="text-center">
                <h1 className="text-3xl md:text-5xl font-bold mb-4">مرحباً بك في {mockStoreSettings.name}</h1>
                <p className="text-lg mb-6 opacity-90">أحدث الصيحات العصرية بأسعار منافسة</p>
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 bg-white text-primary-900 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition"
                >
                  تصفح المنتجات
                  <ArrowLeft className="w-5 h-5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">الأقسام</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {mockCategories.map((category) => (
              <Link
                key={category.id}
                to={`/products?category=${category.id}`}
                className="bg-gray-50 rounded-xl p-6 text-center hover:bg-primary-50 hover:shadow-md transition group"
              >
                <div className="w-16 h-16 mx-auto mb-3 bg-primary-100 rounded-full flex items-center justify-center group-hover:bg-primary-200 transition">
                  <span className="text-3xl">
                    {category.name === 'ملابس نسائية' && '👗'}
                    {category.name === 'ملابس رجالية' && '👔'}
                    {category.name === 'أحذية' && '👟'}
                    {category.name === 'إكسسوارات' && '⌚'}
                    {category.name === 'حقائب' && '👜'}
                    {category.name === 'عطور' && '🌸'}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition">
                  {category.name}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">المنتجات المميزة</h2>
            <Link to="/products" className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              عرض الكل
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Promo Banner */}
      <section className="py-12 bg-primary-900 text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">اشترِ عبر واتساب</h2>
              <p className="text-primary-200 text-lg">
                تسوق بسهولة وأرسل لنا طلبك مباشرة عبر واتساب
              </p>
            </div>
            <a
              href={`https://wa.me/${mockStoreSettings.socialLinks.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-lg font-semibold flex items-center gap-2 transition"
            >
              <span>تواصل الآن</span>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">وصل حديثاً</h2>
            <Link to="/products?sort=newest" className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              عرض الكل
              <ArrowLeft className="w-4 h-4" />
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
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">🚚</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">شحن سريع</h3>
              <p className="text-sm text-gray-500">توصيل لجميع المدن</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">🔒</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">دفع آمن</h3>
              <p className="text-sm text-gray-500">طرق دفع متعددة</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">↩️</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">استرجاع سهل</h3>
              <p className="text-sm text-gray-500">ضمان استرجاع المنتج</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">💬</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">دعم فني</h3>
              <p className="text-sm text-gray-500">24/7 عبر واتساب</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
