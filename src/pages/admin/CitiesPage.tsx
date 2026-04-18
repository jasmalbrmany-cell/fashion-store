import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, MapPin, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { citiesService, hasValidCache, getCachedSync } from '@/services/api';
import { City } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { useNotificationContext } from '@/context/NotificationContext';

const CitiesPage: React.FC = () => {
  const { t, language, isRTL } = useLanguage();
  const { showSuccess, showError } = useNotificationContext();
  const [cities, setCities] = useState<City[]>(getCachedSync<City[]>('cities_all') || []);
  const [loading, setLoading] = useState(!hasValidCache('cities_all'));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    shippingCost: '',
    isActive: true,
  });

  const showToast = (type: 'success' | 'error', msg: string) => {
    if (type === 'success') showSuccess(msg);
    else showError(msg);
  };

  const loadCities = async () => {
    try {
      setLoading(true);
      const data = await citiesService.getAll();
      setCities(data);
    } catch (error) {
      console.error('Failed to load cities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCities();
  }, []);

  const filteredCities = cities.filter(city =>
    city.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenModal = (city?: City) => {
    if (city) {
      setEditingCity(city);
      setFormData({
        name: city.name,
        shippingCost: city.shippingCost.toString(),
        isActive: city.isActive,
      });
    } else {
      setEditingCity(null);
      setFormData({ name: '', shippingCost: '', isActive: true });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCity(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check for duplicates
    const duplicate = cities.find(c => 
      c.name.trim().toLowerCase() === formData.name.trim().toLowerCase() && 
      (!editingCity || c.id !== editingCity.id)
    );

    if (duplicate) {
      showToast('error', '❌ ' + (t.cityDuplicate || 'هذه المدينة موجودة بالفعل'));
      return;
    }

    try {
      setLoading(true);
      if (editingCity) {
        const updated = await citiesService.update(editingCity.id, {
          name: formData.name,
          shippingCost: Number(formData.shippingCost),
          isActive: formData.isActive
        });
        if (updated) {
          setCities(prev => prev.map(c => c.id === editingCity.id ? updated : c));
          showToast('success', '✅ ' + (t.cityUpdated || 'تم تحديث المدينة بنجاح'));
        } else {
          showToast('error', '❌ فشل تحديث المدينة - حاول مرة أخرى');
        }
      } else {
        const created = await citiesService.create({
          name: formData.name,
          shippingCost: Number(formData.shippingCost),
          isActive: formData.isActive
        });
        if (created) {
          setCities(prev => [...prev, created]);
          showToast('success', '✅ ' + (t.cityAdded || 'تم إضافة المدينة بنجاح'));
        } else {
          showToast('error', '❌ فشل إنشاء المدينة - حاول مرة أخرى');
        }
      }
      handleCloseModal();
    } catch (error: any) {
      console.error('❌ Failed to save city:', error);
      const errorMsg = error?.message || t.citySaveError || 'حدث خطأ أثناء الحفظ - تحقق من الاتصال';
      showToast('error', '❌ ' + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t.confirmDeleteCity)) {
      try {
        setLoading(true);
        const success = await citiesService.delete(id);
        if (success) {
           setCities(prev => prev.filter(c => c.id !== id));
           showToast('success', '✅ ' + (t.deletedSuccessfully || 'تم الحذف بنجاح'));
        } else {
          showToast('error', '❌ فشل حذف المدينة - حاول مرة أخرى');
        }
      } catch (error: any) {
        console.error('❌ Failed to delete city:', error);
        const errorMsg = error?.message || t.cityDeleteError || 'حدث خطأ أثناء الحذف - تحقق من الاتصال';
        showToast('error', '❌ ' + errorMsg);
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleActive = async (city: City) => {
    try {
      setLoading(true);
      const updated = await citiesService.update(city.id, { isActive: !city.isActive });
      if (updated) {
        setCities(prev => prev.map(c => c.id === city.id ? updated : c));
        showToast('success', '✅ ' + (city.isActive ? 'تم إلغاء تفعيل المدينة' : 'تم تفعيل المدينة'));
      } else {
        showToast('error', '❌ فشل تحديث حالة المدينة - حاول مرة أخرى');
      }
    } catch (error: any) {
      console.error('❌ Failed to toggle city status:', error);
      const errorMsg = error?.message || 'حدث خطأ أثناء تحديث الحالة - تحقق من الاتصال';
      showToast('error', '❌ ' + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-black" />
        <p className="font-bold text-gray-400 animate-pulse">{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Toast: now handled globally */}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">{t.adminCitiesTitle}</h1>
          <p className="text-gray-500 font-bold">{cities.length} {t.citiesCountLabel}</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-2xl hover:bg-gray-800 transition shadow-xl shadow-gray-100 font-black uppercase text-sm tracking-widest"
        >
          <Plus className="w-5 h-5" />
          {t.addCity}
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-3xl shadow-sm border p-4">
        <div className="relative">
          <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5`} />
          <input
            type="text"
            placeholder={t.searchCity}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full ${isRTL ? 'pr-12' : 'pl-12'} py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black outline-none font-bold`}
          />
        </div>
      </div>

      {/* Cities List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCities.map((city) => (
          <div
            key={city.id}
            className={`bg-white rounded-3xl shadow-sm hover:shadow-md border p-6 flex flex-col gap-6 transition-all ${
              !city.isActive ? 'bg-gray-50/50' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  city.isActive ? 'bg-green-100 border border-green-200' : 'bg-gray-100 border border-gray-200'
                }`}>
                  <MapPin className={`w-6 h-6 ${city.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-lg leading-tight">{city.name}</h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${city.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-tighter">{city.isActive ? t.active : t.inactive}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenModal(city)}
                  className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-black border border-transparent hover:border-gray-200 transition"
                  title={t.edit}
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(city.id)}
                  className="p-2 hover:bg-red-50 rounded-xl text-gray-400 hover:text-red-600 border border-transparent hover:border-red-100 transition"
                  title={t.delete}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between items-center group overflow-hidden relative">
               <div className="absolute inset-y-0 left-0 w-1 bg-black translate-y-full group-hover:translate-y-0 transition-transform"></div>
               <span className="text-xs font-black uppercase text-gray-400 tracking-widest">{t.shippingCostLabel}</span>
               <span className="font-black text-black">{city.shippingCost.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')} {t.rial}</span>
            </div>

            <button
               onClick={() => toggleActive(city)}
               className={`w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                 city.isActive
                   ? 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white'
                   : 'bg-green-50 text-green-600 hover:bg-green-600 hover:text-white'
               }`}
            >
               {city.isActive ? t.deactivate : t.activate}
            </button>
          </div>
        ))}
      </div>

      {filteredCities.length === 0 && (
        <div className="bg-white rounded-[2rem] shadow-sm p-20 text-center border border-dashed border-gray-200">
           <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 transition-transform hover:scale-110">
              <MapPin className="w-10 h-10 text-gray-300" />
           </div>
           <p className="text-gray-400 font-extrabold text-xl">{t.noCitiesFound}</p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between p-8 border-b bg-gray-50/50">
              <h2 className="text-2xl font-black text-gray-900 leading-tight">
                {editingCity ? t.editCity : t.addCity}
              </h2>
              <button onClick={handleCloseModal} className="p-3 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-gray-100">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">{t.cityName}</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t.cityPlaceholder}
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black outline-none font-bold"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">{t.shippingCostLabel}</label>
                <input
                  type="number"
                  value={formData.shippingCost}
                  onChange={(e) => setFormData(prev => ({ ...prev, shippingCost: e.target.value }))}
                  placeholder="3000"
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black outline-none font-bold"
                  required
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
                <label htmlFor="isActive" className="text-gray-700 font-black flex-1 cursor-pointer">{t.active}</label>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-4 text-gray-400 font-black uppercase tracking-widest text-sm hover:text-red-500 transition-colors"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-black text-white rounded-2xl hover:bg-gray-800 transition shadow-2xl shadow-gray-200 font-black uppercase tracking-widest text-sm"
                >
                  {editingCity ? t.saveChanges : t.addCity}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitiesPage;
