import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Image as ImageIcon, Video, Type, X, Eye, EyeOff, Loader2, RefreshCw, Layers, CheckCircle2, AlertCircle } from 'lucide-react';
import { adsService } from '@/services/api';
import { Ad, AdType, AdPosition } from '@/types';
import { useLanguage } from '@/context/LanguageContext';

const AdsPage: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const [ads, setAds] = useState<Ad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    type: 'image' as AdType,
    content: '',
    imageUrl: '',
    link: '',
    position: 'top' as AdPosition,
    isActive: true,
  });

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAds = async () => {
    setIsLoading(true);
    try {
      const data = await adsService.getAll();
      setAds(data || []);
    } catch (err) {
      console.error('Failed to fetch ads:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const filteredAds = ads.filter(ad =>
    ad.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenModal = (ad?: Ad) => {
    if (ad) {
      setEditingAd(ad);
      setFormData({
        title: ad.title,
        type: ad.type,
        content: ad.content,
        imageUrl: ad.imageUrl || '',
        link: ad.link || '',
        position: ad.position,
        isActive: ad.isActive,
      });
    } else {
      setEditingAd(null);
      setFormData({
        title: '',
        type: 'image',
        content: '',
        imageUrl: '',
        link: '',
        position: 'top',
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAd(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingAd) {
        await adsService.update(editingAd.id, formData);
      } else {
        await adsService.create({
          ...formData,
          order: ads.length + 1
        });
      }
      await fetchAds();
      handleCloseModal();
      showToast('success', editingAd ? (isRTL ? 'تم تحديث الإعلان بنجاح' : 'Ad updated successfully') : (isRTL ? 'تم إضافة الإعلان بنجاح' : 'Ad added successfully'));
    } catch (err) {
      console.error('Failed to save ad:', err);
      showToast('error', isRTL ? 'فشل في حفظ الإعلان' : 'Failed to save ad');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t.confirmDeleteAd)) {
      try {
        await adsService.delete(id);
        setAds(prev => prev.filter(a => a.id !== id));
        showToast('success', isRTL ? 'تم حذف الإعلان بنجاح' : 'Ad deleted successfully');
      } catch (err) {
        console.error('Failed to delete ad:', err);
        showToast('error', isRTL ? 'فشل في حذف الإعلان' : 'Failed to delete ad');
      }
    }
  };

  const toggleActive = async (ad: Ad) => {
    try {
      setAds(prev =>
        prev.map(a =>
          a.id === ad.id ? { ...a, isActive: !a.isActive } : a
        )
      );
      await adsService.update(ad.id, { isActive: !ad.isActive });
    } catch (err) {
      console.error('Failed to toggle ad status:', err);
      // Revert if failed
      setAds(prev =>
        prev.map(a =>
          a.id === ad.id ? { ...a, isActive: ad.isActive } : a
        )
      );
    }
  };

  const getTypeIcon = (type: AdType) => {
    switch (type) {
      case 'image': return <ImageIcon className="w-5 h-5" />;
      case 'video': return <Video className="w-5 h-5" />;
      case 'text': return <Type className="w-5 h-5" />;
    }
  };

  const getTypeLabel = (type: AdType) => {
    switch (type) {
      case 'image': return t.imageType;
      case 'video': return t.videoType;
      case 'text': return t.textType;
    }
  };

  const getPositionLabel = (position: AdPosition) => {
    const labels: Record<AdPosition, string> = {
      top: t.adTop,
      bottom: t.adBottom,
      sidebar: t.adSidebar,
      inline: t.adInline,
      popup: t.adPopup,
    };
    return labels[position];
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-12 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-8 py-4 rounded-[1.5rem] shadow-2xl text-white font-black uppercase tracking-widest text-xs animate-in slide-in-from-top-12 ${
          toast.type === 'success' ? 'bg-black border border-white/10' : 'bg-red-600'
        }`}>
          {toast.type === 'success' ? (
              <div className="p-1 bg-green-500 rounded-full">
                  <CheckCircle2 className={`w-4 h-4 text-white`} />
              </div>
          ) : <AlertCircle className="w-5 h-5" />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">{t.adminAdsTitle}</h1>
          <p className="text-gray-500 font-bold">{ads.length} {t.adsCount}</p>
        </div>
        <div className="flex gap-2">
            <button
                onClick={fetchAds}
                className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition shadow-sm"
                title={t.refresh}
            >
                <RefreshCw className={`w-5 h-5 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
                onClick={() => handleOpenModal()}
                className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-2xl hover:bg-gray-800 transition shadow-xl shadow-gray-100 font-black uppercase text-sm tracking-widest"
            >
                <Plus className="w-5 h-5" />
                {t.addAd}
            </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-3xl shadow-sm border p-4">
        <div className="relative">
          <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5`} />
          <input
            type="text"
            placeholder={isRTL ? 'ابحث عن إعلان...' : 'Search for an ad...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full ${isRTL ? 'pr-12' : 'pl-12'} py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black outline-none font-bold`}
          />
        </div>
      </div>

      {/* Ads List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-black" />
            <p className="text-gray-400 font-black animate-pulse">{t.loading}</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAds.map((ad) => (
            <div
                key={ad.id}
                className={`bg-white rounded-[2rem] shadow-sm overflow-hidden border transition-all hover:shadow-md group flex flex-col ${
                    !ad.isActive ? 'bg-gray-50/50' : 'border-gray-100'
                }`}
            >
                {/* Visual Preview */}
                <div className="h-48 bg-gray-100 relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
                    {ad.imageUrl ? (
                        <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                           <div className="p-4 bg-white/50 backdrop-blur-sm rounded-2xl shadow-sm">
                              {getTypeIcon(ad.type)}
                           </div>
                           <span className="text-[10px] font-black uppercase tracking-widest">{getTypeLabel(ad.type)}</span>
                        </div>
                    )}
                    {/* Status Badge */}
                    <div className={`absolute top-4 ${isRTL ? 'right-4' : 'left-4'} px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg backdrop-blur-md ${
                        ad.isActive ? 'bg-green-500/90 text-white' : 'bg-gray-500/90 text-white'
                    }`}>
                        <div className={`w-1.5 h-1.5 rounded-full bg-white ${ad.isActive ? 'animate-pulse' : ''}`}></div>
                        {ad.isActive ? t.active : t.inactive}
                    </div>
                </div>

                <div className="p-6 flex flex-col flex-1 gap-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <h3 className="font-black text-gray-900 text-lg leading-tight line-clamp-2">{ad.title}</h3>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 px-2 py-1 rounded-lg border border-blue-100">
                                    {getPositionLabel(ad.position)}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                            <button
                                onClick={() => handleOpenModal(ad)}
                                className="p-2 hover:bg-black hover:text-white rounded-xl text-gray-400 transition border border-transparent hover:border-black"
                                title={t.edit}
                            >
                                <Edit className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleDelete(ad.id)}
                                className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-xl transition border border-transparent hover:border-red-100"
                                title={t.delete}
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                        <button
                            onClick={() => toggleActive(ad)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                ad.isActive
                                ? 'bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white'
                                : 'bg-green-50 text-green-600 hover:bg-green-600 hover:text-white'
                            }`}
                        >
                            {ad.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            {ad.isActive ? (isRTL ? 'إخفاء الإعلان' : 'Hide Ad') : (isRTL ? 'إظهار الإعلان' : 'Show Ad')}
                        </button>
                        
                        <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                            <Layers className="w-4 h-4" />
                            {ad.order || 0}
                        </div>
                    </div>
                </div>
            </div>
            ))}

            {filteredAds.length === 0 && (
            <div className="col-span-full bg-white rounded-[2.5rem] shadow-sm p-20 text-center border border-dashed border-gray-200">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ImageIcon className="w-10 h-10 text-gray-200" />
                </div>
                <p className="text-gray-400 font-black text-xl">{isRTL ? 'لا توجد إعلانات' : 'No ads found'}</p>
            </div>
            )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-8 border-b bg-gray-50/50">
              <h2 className="text-2xl font-black text-gray-900 leading-tight">
                {editingAd ? t.editAd : t.addAd}
              </h2>
              <button onClick={handleCloseModal} className="p-3 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-gray-100">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto flex-1">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2">{t.adTitle}</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={t.adTitlePlaceholder}
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black outline-none font-bold shadow-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2">{t.adType}</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as AdType }))}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black outline-none font-black shadow-sm"
                  >
                    <option value="image">{t.imageType}</option>
                    <option value="video">{t.videoType}</option>
                    <option value="text">{t.textType}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2">{t.adPosition}</label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value as AdPosition }))}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black outline-none font-black shadow-sm"
                  >
                    <option value="top">{t.adTop}</option>
                    <option value="bottom">{t.adBottom}</option>
                    <option value="sidebar">{t.adSidebar}</option>
                    <option value="inline">{t.adInline}</option>
                    <option value="popup">{t.adPopup}</option>
                  </select>
                </div>
              </div>

              {formData.type === 'image' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2">{t.adImageUrl}</label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder={t.adImageUrlPlaceholder}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black outline-none font-bold shadow-sm"
                    required
                  />
                </div>
              )}

              {formData.type === 'text' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2">{t.adContent}</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    rows={3}
                    placeholder={t.adContentPlaceholder}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black outline-none font-bold shadow-sm"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2">{t.adLink}</label>
                <input
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                  placeholder={t.adLinkPlaceholder}
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black outline-none font-bold shadow-sm"
                />
              </div>

              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 group cursor-pointer" onClick={() => setFormData(p => ({ ...p, isActive: !p.isActive }))}>
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="w-6 h-6 rounded-lg border-gray-300 accent-black cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                />
                <label htmlFor="isActive" className="text-gray-700 font-black flex-1 cursor-pointer">{t.adActive}</label>
              </div>

              <div className="flex gap-4 pt-4 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-4 text-gray-400 font-black uppercase tracking-widest text-sm hover:text-red-500 transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-black text-white rounded-2xl hover:bg-gray-800 transition font-black flex items-center justify-center gap-2 shadow-2xl shadow-gray-200 disabled:opacity-50 uppercase tracking-widest text-sm"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> {t.saving}</>
                  ) : (
                    editingAd ? t.saveChanges : t.addAd
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdsPage;
