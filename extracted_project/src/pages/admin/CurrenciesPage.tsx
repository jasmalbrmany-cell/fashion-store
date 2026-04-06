import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, DollarSign, X } from 'lucide-react';
import { mockCurrencies } from '@/data/mockData';
import { Currency } from '@/types';

const CurrenciesPage: React.FC = () => {
  const [currencies, setCurrencies] = useState<Currency[]>(mockCurrencies);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    exchangeRate: '',
    symbol: '',
  });

  const filteredCurrencies = currencies.filter(currency =>
    currency.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    currency.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenModal = (currency?: Currency) => {
    if (currency) {
      setEditingCurrency(currency);
      setFormData({
        code: currency.code,
        name: currency.name,
        exchangeRate: currency.exchangeRate.toString(),
        symbol: currency.symbol,
      });
    } else {
      setEditingCurrency(null);
      setFormData({ code: '', name: '', exchangeRate: '', symbol: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCurrency(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingCurrency) {
      setCurrencies(prev =>
        prev.map(c =>
          c.id === editingCurrency.id
            ? { ...c, code: formData.code, name: formData.name, exchangeRate: Number(formData.exchangeRate), symbol: formData.symbol }
            : c
        )
      );
    } else {
      const newCurrency: Currency = {
        id: `cur-${Date.now()}`,
        code: formData.code,
        name: formData.name,
        exchangeRate: Number(formData.exchangeRate),
        symbol: formData.symbol,
      };
      setCurrencies(prev => [...prev, newCurrency]);
    }
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (id === 'cur-1') {
      alert('لا يمكن حذف العملة الأساسية');
      return;
    }
    if (confirm('هل أنت متأكد من حذف هذه العملة؟')) {
      setCurrencies(prev => prev.filter(c => c.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">العملات</h1>
          <p className="text-gray-500">إدارة أسعار الصرف</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition"
        >
          <Plus className="w-5 h-5" />
          إضافة عملة
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <p className="text-blue-800 text-sm">
          <strong>ملاحظة:</strong> العملة الأساسية هي الريال اليمني (YER). جميع الأسعار في المتجر تُعرض بهذه العملة.
          يتم تحويل أسعار المنتجات المستوردة تلقائياً حسب سعر الصرف المحدد.
        </p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="ابحث عن عملة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
          />
        </div>
      </div>

      {/* Currencies List */}
      <div className="grid gap-4">
        {filteredCurrencies.map((currency, index) => (
          <div
            key={currency.id}
            className="bg-white rounded-xl shadow-sm p-6 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                index === 0 ? 'bg-yellow-100' : 'bg-gray-100'
              }`}>
                <DollarSign className={`w-6 h-6 ${index === 0 ? 'text-yellow-600' : 'text-gray-600'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{currency.name}</h3>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{currency.code}</span>
                  {index === 0 && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">أساسية</span>
                  )}
                </div>
                <p className="text-gray-500 text-sm">
                  سعر الصرف: <span className="font-medium">1 {currency.code} = {(1 / currency.exchangeRate).toFixed(2)} YER</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-left">
                <p className="font-bold text-lg text-gray-900">{currency.symbol}</p>
                <p className="text-xs text-gray-500">الرمز</p>
              </div>
              {index !== 0 && (
                <>
                  <button
                    onClick={() => handleOpenModal(currency)}
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(currency.id)}
                    className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredCurrencies.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <DollarSign className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">لا توجد عملات</p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCurrency ? 'تعديل عملة' : 'إضافة عملة'}
              </h2>
              <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">كود العملة</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="مثال: USD"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">الرمز</label>
                  <input
                    type="text"
                    value={formData.symbol}
                    onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value }))}
                    placeholder="مثال: $"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اسم العملة</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="مثال: دولار أمريكي"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">سعر الصرف (مقابل الريال اليمني)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={formData.exchangeRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, exchangeRate: e.target.value }))}
                  placeholder="مثال: 0.004"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  مثال: إذا كان سعر صرف الدولار = 0.004، يعني 1 دولار = 250 ريال يمني
                </p>
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
                  {editingCurrency ? 'حفظ التغييرات' : 'إضافة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrenciesPage;
