import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, Image, Video, Type, X, Eye, EyeOff } from 'lucide-react';
import { mockAds } from '@/data/mockData';
import { Ad, AdType, AdPosition } from '@/types';

const AdsPage: React.FC = () => {
  const [ads, setAds] = useState<Ad[]>(mockAds);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    type: 'image' as AdType,
    content: '',
    imageUrl: '',
    link: '',
    position: 'top' as AdPosition,
    isActive: true,
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingAd) {
      setAds(prev =>
        prev.map(a =>
          a.id === editingAd.id
            ? { ...a, ...formData }
            : a
        )
      );
    } else {
      const newAd: Ad = {
        id: `ad-${Date.now()}`,
        ...formData,
        order: ads.length + 1,
        createdAt: new Date().toISOString(),
      };
      setAds(prev => [...prev, newAd]);
    }
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الإعلان؟')) {
      setAds(prev => prev.filter(a => a.id !== id));
    }
  };

  const toggleActive = (id: string) => {
    setAds(prev =>
      prev.map(a =>
        a.id === id ? { ...a, isActive: !a.isActive } : a
      )
    );
  };

  const getTypeIcon = (type: AdType) => {
    switch (type) {
      case 'image': return <Image className="w-5 h-5" />;
      case 'video': return <Video className="w-5 h-5" />;
      case 'text': return <Type className="w-5 h-5" />;
    }
  };

  const getPositionLabel = (position: AdPosition) => {
    const labels: Record<AdPosition, string> = {
      top: 'أعلى الصفحة',
      bottom: 'أسفل الصفحة',
      sidebar: 'جانبي',
      inline: 'داخل الأقسام',
      popup: 'نافذة منبثقة',
    };
    return labels[position];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الإعلانات</h1>
          <p className="text-gray-500">{ads.length} إعلان</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition"
        >
          <Plus className="w-5 h-5" />
          إضافة إعلان
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="ابحث عن إعلان..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
          />
        </div>
      </div>

      {/* Ads List */}
      <div className="grid gap-4">
        {filteredAds.map((ad) => (
          <div
            key={ad.id}
            className={`bg-white rounded-xl shadow-sm overflow-hidden ${
              !ad.isActive ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                  {ad.imageUrl ? (
                    <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {getTypeIcon(ad.type)}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{ad.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {getTypeIcon(ad.type)}
                      {ad.type === 'image' ? 'صورة' : ad.type === 'video' ? 'فيديو' : 'نص'}
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">
                      {getPositionLabel(ad.position)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(ad.id)}
                  className={`p-2 rounded-lg transition ${
                    ad.isActive
                      ? 'bg-green-100 text-green-600 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                  title={ad.isActive ? 'إخفاء' : 'إظهار'}
                >
                  {ad.isActive ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => handleOpenModal(ad)}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(ad.id)}
                  className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAds.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Image className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">لا توجد إعلانات</p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-8">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingAd ? 'تعديل إعلان' : 'إضافة إعلان'}
              </h2>
              <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">عنوان الإعلان</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="مثال: خصم 20%"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">النوع</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as AdType }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="image">صورة</option>
                    <option value="video">فيديو</option>
                    <option value="text">نص</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">مكان الظهور</label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value as AdPosition }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="top">أعلى الصفحة</option>
                    <option value="bottom">أسفل الصفحة</option>
                    <option value="sidebar">جانبي</option>
                    <option value="inline">داخل الأقسام</option>
                    <option value="popup">نافذة منبثقة</option>
                  </select>
                </div>
              </div>

              {formData.type === 'image' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">رابط الصورة</label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
              )}

              {formData.type === 'text' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">المحتوى النصي</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    rows={3}
                    placeholder="نص الإعلان..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">رابط التوجيه (اختياري)</label>
                <input
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="w-5 h-5 rounded border-gray-300"
                />
                <label htmlFor="isActive" className="text-gray-700">مفعل</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition"
                >
                  {editingAd ? 'حفظ التغييرات' : 'إضافة'}
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
