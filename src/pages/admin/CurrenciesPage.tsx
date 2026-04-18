import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, DollarSign, X, Loader2, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { currenciesService, hasValidCache, getCachedSync } from '@/services/api';
import { Currency } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { useNotificationContext } from '@/context/NotificationContext';

const CurrenciesPage: React.FC = () => {
  const { t, language, isRTL } = useLanguage();
  const { showSuccess, showError } = useNotificationContext();
  const [currencies, setCurrencies] = useState<Currency[]>(getCachedSync<Currency[]>('currencies_all') || []);
  const [loading, setLoading] = useState(!hasValidCache('currencies_all'));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    exchangeRate: '',
    symbol: '',
  });


  const loadData = async () => {
    try {
      if (!hasValidCache('currencies_all')) {
          setLoading(true);
      }
      const data = await currenciesService.getAll();
      setCurrencies(data);
    } catch (error) {
      console.error('Failed to load currencies:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredCurrencies = currencies.filter(currency => {
    const nameStr = currency.name || '';
    const codeStr = currency.code || '';
    return nameStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
           codeStr.toLowerCase().includes(searchQuery.toLowerCase());
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      if (editingCurrency) {
        const updated = await currenciesService.update(editingCurrency.id, {
          code: formData.code,
          name: formData.name,
          exchangeRate: Number(formData.exchangeRate),
          symbol: formData.symbol
        });
        if (updated) {
          setCurrencies(prev => prev.map(c => c.id === editingCurrency.id ? updated : c));
          showSuccess('✅ ' + (t.currencyUpdated || 'تم تحديث العملة بنجاح'));
        } else {
          showError('❌ فشل تحديث العملة - حاول مرة أخرى');
        }
      } else {
        const created = await currenciesService.create({
          code: formData.code,
          name: formData.name,
          exchangeRate: Number(formData.exchangeRate),
          symbol: formData.symbol
        });
        if (created) {
          setCurrencies(prev => [...prev, created]);
          showSuccess('✅ ' + (t.currencyAdded || 'تم إضافة العملة بنجاح'));
        } else {
          showError('❌ فشل إنشاء العملة - حاول مرة أخرى');
        }
      }
      handleCloseModal();
    } catch (error: any) {
      console.error('❌ Failed to save currency:', error);
      const errorMsg = error?.message || t.currencySaveError || 'حدث خطأ أثناء الحفظ - تحقق من الاتصال';
      showError('❌ ' + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (id === 'cur-1' || id === '1') { // Protect base currency
      showError('❌ ' + (t.cannotDeleteBaseCurrency || 'لا يمكن حذف العملة الأساسية'));
      return;
    }
    if (window.confirm(t.confirmDeleteCurrency)) {
      try {
        setLoading(true);
        const success = await currenciesService.delete(id);
        if (success) {
          setCurrencies(prev => prev.filter(c => c.id !== id));
          showSuccess('✅ ' + (t.currencyDeleted || 'تم حذف العملة بنجاح'));
        } else {
          showError('❌ فشل حذف العملة - حاول مرة أخرى');
        }
      } catch (error: any) {
        console.error('❌ Failed to delete currency:', error);
        const errorMsg = error?.message || t.currencyDeleteError || 'حدث خطأ أثناء الحذف - تحقق من الاتصال';
        showError('❌ ' + errorMsg);
      } finally {
        setLoading(false);
      }
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

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">{t.currenciesTitle}</h1>
          <p className="text-gray-500 font-bold">{t.manageExchangeRates}</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-2xl hover:bg-gray-800 transition shadow-xl shadow-gray-100 font-black uppercase text-sm tracking-widest"
        >
          <Plus className="w-5 h-5" />
          {t.addCurrency}
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50/50 rounded-3xl p-6 border border-blue-100 flex gap-4 items-start shadow-sm">
        <div className="p-2 bg-blue-100 rounded-xl">
           <Info className="w-5 h-5 text-blue-600" />
        </div>
        <div>
           <p className="text-blue-900 font-black text-sm uppercase tracking-widest">{t.importantNote}</p>
           <p className="text-blue-700 text-sm font-bold mt-1 leading-relaxed">
             {t.currencyInfoNote}
           </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-3xl shadow-sm border p-4">
        <div className="relative">
          <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5`} />
          <input
            type="text"
            placeholder={t.searchCurrency}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full ${isRTL ? 'pr-12' : 'pl-12'} py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black outline-none font-bold`}
          />
        </div>
      </div>

      {/* Currencies List */}
      <div className="grid gap-6 md:grid-cols-2">
        {filteredCurrencies.map((currency, index) => {
          const isBase = currency.id === 'cur-1' || currency.id === '1';
          return (
            <div
              key={currency.id}
              className={`bg-white rounded-[2rem] shadow-sm p-8 flex flex-col gap-6 border transition-all hover:shadow-md ${
                isBase ? 'border-yellow-200 bg-yellow-50/10' : 'border-gray-100'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
                    isBase ? 'bg-yellow-100 border-yellow-200 shadow-sm shadow-yellow-100' : 'bg-gray-50 border-gray-100'
                  }`}>
                    <DollarSign className={`w-7 h-7 ${isBase ? 'text-yellow-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 text-xl leading-tight">{currency.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-black bg-black text-white px-2 py-0.5 rounded tracking-widest uppercase">{currency.code}</span>
                        {isBase && (
                          <span className="text-[10px] font-black bg-yellow-400 text-black px-2 py-0.5 rounded tracking-widest uppercase">{t.baseCurrency}</span>
                        )}
                    </div>
                  </div>
                </div>
                {!isBase && (
                    <div className="flex gap-2">
                    <button
                        onClick={() => handleOpenModal(currency)}
                        className="p-2 hover:bg-black hover:text-white rounded-xl text-gray-400 transition border border-transparent hover:border-black"
                    >
                        <Edit className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleDelete(currency.id)}
                        className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-xl transition border border-transparent hover:border-red-100"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    </div>
                )}
              </div>
              
              <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 divide-y divide-gray-200/50">
                  <div className="pb-3 flex justify-between items-center text-sm">
                      <span className="text-gray-400 font-black uppercase tracking-widest text-[10px]">{t.relativeToBase}</span>
                      <span className="font-black text-gray-900">1 {currency.code} = {currency.exchangeRate > 0 ? (1 / currency.exchangeRate).toFixed(2) : 1} YER</span>
                  </div>
                  <div className="pt-3 flex justify-between items-center text-sm">
                      <span className="text-gray-400 font-black uppercase tracking-widest text-[10px]">{t.symbolLabel}</span>
                      <span className="text-2xl font-black text-black">{currency.symbol}</span>
                  </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCurrencies.length === 0 && (
        <div className="bg-white rounded-[2.5rem] shadow-sm p-20 text-center border border-dashed border-gray-200">
          <DollarSign className="w-16 h-16 mx-auto text-gray-200 mb-6 animate-bounce" />
          <p className="text-gray-400 font-black text-xl">{t.noCurrenciesFound}</p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between p-8 border-b bg-gray-50/50">
              <h2 className="text-2xl font-black text-gray-900 leading-tight">
                {editingCurrency ? t.editCurrency : t.addCurrency}
              </h2>
              <button onClick={handleCloseModal} className="p-3 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-gray-100">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2">{t.currencyCode}</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="USD"
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black outline-none font-bold"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2">{t.symbolLabel}</label>
                  <input
                    type="text"
                    value={formData.symbol}
                    onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value }))}
                    placeholder="$"
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black outline-none font-bold"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2">{t.currencyName}</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t.currencyNamePlaceholder}
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black outline-none font-bold"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2">{t.exchangeRateLabel}</label>
                <input
                  type="number"
                  step="0.000001"
                  value={formData.exchangeRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, exchangeRate: e.target.value }))}
                  placeholder="0.004"
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black outline-none font-bold"
                  required
                />
                <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-2xl mt-4">
                    <p className="text-[10px] text-yellow-800 font-bold leading-relaxed">
                        {t.exchangeRateInfo}
                    </p>
                </div>
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
                  {editingCurrency ? t.saveChanges : t.addCurrency}
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
