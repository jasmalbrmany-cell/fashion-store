import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Trash2, Edit2, Globe, User, Lock, 
  Save, X, ExternalLink, ShieldCheck, Loader, Key, AlertTriangle
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useToast } from '@/components/Common/Toast';

interface ExternalStore {
  id: string;
  name: string;
  url: string;
  username?: string;
  password?: string;
  created_at: string;
}

const ExternalStoresPage: React.FC = () => {
  const { isRTL, t } = useLanguage();
  const { toast } = useToast();
  const [stores, setStores] = useState<ExternalStore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showLocalFallback, setShowLocalFallback] = useState(false);
  
  // Form state
  const [editingStore, setEditingStore] = useState<ExternalStore | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    username: '',
    password: ''
  });

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    setIsLoading(true);
    if (!isSupabaseConfigured()) {
      const saved = localStorage.getItem('demo_external_stores');
      if (saved) setStores(JSON.parse(saved));
      setIsLoading(false);
      return;
    }
    const withTimeout = (promise: Promise<any>, ms = 10000) => {
      return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
      ]);
    };

    try {
      const { data, error } = await withTimeout(
        (supabase as any)
          .from('external_stores')
          .select('*')
          .order('created_at', { ascending: false })
      );

      if (error) throw error;
      setStores(data || []);
    } catch (err: any) {
      console.error('Fetch stores error:', err);
      toast.error(isRTL ? 'فشل تحميل المتاجر' : 'Failed to load stores');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (store?: ExternalStore) => {
    if (store) {
      setEditingStore(store);
      setFormData({
        name: store.name,
        url: store.url,
        username: store.username || '',
        password: store.password || ''
      });
    } else {
      setEditingStore(null);
      setFormData({ name: '', url: '', username: '', password: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-clean URL
    let cleanUrl = formData.url.trim();
    if (cleanUrl.startsWith('/')) {
      cleanUrl = cleanUrl.substring(1);
    }
    if (cleanUrl && !cleanUrl.startsWith('http')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    if (!formData.name || !cleanUrl) {
      toast.warning(isRTL ? 'يرجى ملء الحقول المطلوبة' : 'Please fill required fields');
      return;
    }

    setIsSaving(true);
    
    if (!isSupabaseConfigured()) {
      const newStore = {
        id: editingStore?.id || Date.now().toString(),
        name: formData.name,
        url: cleanUrl,
        username: formData.username,
        password: formData.password,
        created_at: editingStore?.created_at || new Date().toISOString()
      };
      
      const updatedStores = editingStore 
        ? stores.map(s => s.id === editingStore.id ? newStore : s)
        : [newStore, ...stores];
        
      setStores(updatedStores);
      localStorage.setItem('demo_external_stores', JSON.stringify(updatedStores));
      toast.success(isRTL ? 'تم الحفظ بنجاح (وضع التجربة)' : 'Saved successfully (Demo mode)');
      setIsModalOpen(false);
      setIsSaving(false);
      return;
    }

    try {
      // Helper for timeout
      const withTimeout = (promise: Promise<any>, ms = 10000) => {
        return Promise.race([
          promise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
        ]);
      };

      const table = (supabase as any).from('external_stores');
      const storeData = {
        name: formData.name,
        url: cleanUrl,
        username: formData.username,
        password: formData.password
      };
      if (editingStore) {
        const { error } = await withTimeout(
          table.update({ ...storeData, updated_at: new Date().toISOString() }).eq('id', editingStore.id)
        );
        if (error) throw error;
        toast.success(isRTL ? 'تم تحديث المتجر بنجاح' : 'Store updated successfully');
      } else {
        const { error } = await withTimeout(
          table.insert([storeData])
        );
        if (error) throw error;
        toast.success(isRTL ? 'تم إضافة المتجر بنجاح' : 'Store added successfully');
      }
      setIsModalOpen(false);
      fetchStores();
    } catch (err: any) {
      console.error('Save error:', err);
      const isTimeout = err.message === 'Timeout';
      if (isTimeout) setShowLocalFallback(true);
      
      const msg = isTimeout 
        ? (isRTL ? 'انتهت مهلة الطلب. تأكد من إعدادات قاعدة البيانات أو احفظ محلياً.' : 'Request timeout. Check DB settings or save locally.')
        : (err.message || (isRTL ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred'));
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const saveLocallyAsFallback = () => {
    const cleanUrl = formData.url.trim();
    const newStore = {
      id: editingStore?.id || Date.now().toString(),
      name: formData.name,
      url: cleanUrl,
      username: formData.username,
      password: formData.password,
      created_at: editingStore?.created_at || new Date().toISOString()
    };
    
    const updatedStores = editingStore 
      ? stores.map(s => s.id === editingStore.id ? newStore : s)
      : [newStore, ...stores];
      
    setStores(updatedStores);
    localStorage.setItem('demo_external_stores', JSON.stringify(updatedStores));
    toast.success(isRTL ? 'تم الحفظ محلياً بنجاح' : 'Saved locally successfully');
    setIsModalOpen(false);
    setShowLocalFallback(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isRTL ? 'هل أنت متأكد من حذف هذا المتجر؟' : 'Are you sure you want to delete this store?')) return;

    try {
      const { error } = await (supabase as any)
        .from('external_stores')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success(isRTL ? 'تم حذف المتجر' : 'Store deleted');
      fetchStores();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <Link to="/admin/products/store" className="p-3 bg-gray-50 border rounded-xl hover:bg-black hover:text-white transition-all">
            <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
              {isRTL ? '🔗 ربط المتاجر الخارجية' : '🔗 External Store Connections'}
            </h1>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
              {isRTL ? 'إدارة حسابات وكلمات مرور المتاجر للاستيراد التلقائي' : 'Manage store accounts and credentials for auto-import'}
            </p>
          </div>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-800 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          {isRTL ? 'إضافة متجر جديد' : 'Add New Store'}
        </button>
      </div>

      {/* Info Card */}
      {!isSupabaseConfigured() && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3 text-amber-700 animate-pulse">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-semibold">
            {isRTL 
              ? 'تنبيه: أنت في وضع التجربة. يتم حفظ المتاجر محلياً في متصفحك فقط. لتفعيل الحفظ الدائم، يرجى ربط Supabase.'
              : 'Note: You are in Demo Mode. Stores are saved locally in your browser. Connect Supabase for permanent storage.'}
          </p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 text-blue-700">
        <ShieldCheck className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm font-semibold">
          {isRTL 
            ? 'يتم استخدام هذه البيانات لتسجيل الدخول تلقائياً إلى المتاجر التي تتطلب عضوية أو للوصول إلى واجهات برمجة التطبيقات (API) الخاصة بها لضمان استيراد البيانات بدقة كاملة.'
            : 'These credentials are used to automatically log in to stores that require membership or to access their private APIs for accurate data import.'}
        </p>
      </div>

      {/* Stores List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-white rounded-3xl animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : stores.length === 0 ? (
        <div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-gray-100">
          <Globe className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-400">{isRTL ? 'لا يوجد متاجر مضافة بعد' : 'No stores added yet'}</h3>
          <p className="text-gray-300 text-sm mt-2">{isRTL ? 'ابدأ بإضافة أول متجر للربط التلقائي' : 'Start by adding your first store for auto-connection'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map(store => (
            <div key={store.id} className="group bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:border-black transition-all duration-300 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-gray-50 rounded-full group-hover:bg-black/5 transition-colors duration-500" />
              
              <div className="relative z-10 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenModal(store)} className="p-2 bg-gray-50 hover:bg-black hover:text-white rounded-xl transition text-gray-400">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(store.id)} className="p-2 bg-red-50 hover:bg-red-500 hover:text-white rounded-xl transition text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-black text-gray-900 truncate">{store.name}</h3>
                  <a href={store.url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-gray-400 flex items-center gap-1 hover:text-black transition truncate">
                    {store.url} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="pt-4 space-y-2 border-t border-gray-50">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-bold">{store.username || '---'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Key className="w-4 h-4 text-gray-400" />
                    <span className="font-mono">{store.password ? '••••••••' : '---'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-gray-900">
                  {editingStore ? (isRTL ? 'تعديل المتجر' : 'Edit Store') : (isRTL ? 'إضافة متجر جديد' : 'Add New Store')}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 px-1">{isRTL ? 'اسم المتجر' : 'Store Name'}</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Shein"
                    className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-black outline-none transition-all font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-400 px-1">{isRTL ? 'رابط المتجر' : 'Store URL'}</label>
                  <input
                    required
                    type="url"
                    value={formData.url}
                    onChange={e => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://ar.shein.com"
                    className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-black outline-none transition-all font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 px-1">{isRTL ? 'اسم المستخدم / API Key' : 'Username / API Key'}</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.username}
                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                        className={`w-full ${isRTL ? 'pr-5 pl-12' : 'pl-12 pr-5'} py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-black outline-none transition-all font-bold`}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 px-1">{isRTL ? 'كلمة المرور / API Secret' : 'Password / API Secret'}</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="password"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        className={`w-full ${isRTL ? 'pr-5 pl-12' : 'pl-12 pr-5'} py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-black outline-none transition-all font-bold`}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-all"
                  >
                    {isRTL ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-[2] py-4 bg-black text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isRTL ? 'حفظ البيانات' : 'Save Connection'}
                  </button>
                </div>
                
                {showLocalFallback && (
                  <button
                    type="button"
                    onClick={saveLocallyAsFallback}
                    className="w-full py-4 bg-amber-100 text-amber-700 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-amber-200 transition-all flex items-center justify-center gap-2"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    {isRTL ? 'الحفظ في المتصفح فقط (تخطي القاعدة)' : 'Save in Browser Only (Skip DB)'}
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExternalStoresPage;
