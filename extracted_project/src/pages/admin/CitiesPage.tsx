import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, MapPin, X } from 'lucide-react';
import { mockCities } from '@/data/mockData';
import { City } from '@/types';

const CitiesPage: React.FC = () => {
  const [cities, setCities] = useState<City[]>(mockCities);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    shippingCost: '',
    isActive: true,
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingCity) {
      setCities(prev =>
        prev.map(c =>
          c.id === editingCity.id
            ? { ...c, name: formData.name, shippingCost: Number(formData.shippingCost), isActive: formData.isActive }
            : c
        )
      );
    } else {
      const newCity: City = {
        id: `city-${Date.now()}`,
        name: formData.name,
        shippingCost: Number(formData.shippingCost),
        isActive: formData.isActive,
      };
      setCities(prev => [...prev, newCity]);
    }
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه المدينة؟')) {
      setCities(prev => prev.filter(c => c.id !== id));
    }
  };

  const toggleActive = (id: string) => {
    setCities(prev =>
      prev.map(c =>
        c.id === id ? { ...c, isActive: !c.isActive } : c
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">المدن والشحن</h1>
          <p className="text-gray-500">{cities.length} مدينة</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition"
        >
          <Plus className="w-5 h-5" />
          إضافة مدينة
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="ابحث عن مدينة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
          />
        </div>
      </div>

      {/* Cities List */}
      <div className="grid gap-4">
        {filteredCities.map((city) => (
          <div
            key={city.id}
            className={`bg-white rounded-xl shadow-sm p-6 flex items-center justify-between ${
              !city.isActive ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                city.isActive ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                <MapPin className={`w-6 h-6 ${city.isActive ? 'text-green-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{city.name}</h3>
                <p className="text-gray-500">
                  تكلفة الشحن: <span className="font-medium">{city.shippingCost.toLocaleString('ar-SA')} ر.ي</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleActive(city.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                  city.isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {city.isActive ? 'مفعل' : 'غير مفعل'}
              </button>
              <button
                onClick={() => handleOpenModal(city)}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition"
              >
                <Edit className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleDelete(city.id)}
                className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredCities.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">لا توجد مدن</p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCity ? 'تعديل مدينة' : 'إضافة مدينة'}
              </h2>
              <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اسم المدينة</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="مثال: صنعاء"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">تكلفة الشحن (ريال)</label>
                <input
                  type="number"
                  value={formData.shippingCost}
                  onChange={(e) => setFormData(prev => ({ ...prev, shippingCost: e.target.value }))}
                  placeholder="مثال: 3000"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  required
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
                  {editingCity ? 'حفظ التغييرات' : 'إضافة'}
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
