import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Edit, Trash2, Search, Users as UsersIcon,
  Shield, X, Loader2, RefreshCw, CheckCircle,
  AlertCircle, Eye, EyeOff, Lock
} from 'lucide-react';
import { User, UserRole } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { mockUsers } from '@/data/mockData';

interface UserPermissions {
  can_manage_products: boolean;
  can_manage_orders: boolean;
  can_manage_users: boolean;
  can_manage_ads: boolean;
  can_manage_cities: boolean;
  can_manage_currencies: boolean;
  can_view_reports: boolean;
  can_export_data: boolean;
}

const defaultPermissions: UserPermissions = {
  can_manage_products: false,
  can_manage_orders: false,
  can_manage_users: false,
  can_manage_ads: false,
  can_manage_cities: false,
  can_manage_currencies: false,
  can_view_reports: false,
  can_export_data: false,
};

const permissionLabels: Record<keyof UserPermissions, string> = {
  can_manage_products: 'إدارة المنتجات',
  can_manage_orders: 'إدارة الطلبات',
  can_manage_users: 'إدارة المستخدمين',
  can_manage_ads: 'إدارة الإعلانات',
  can_manage_cities: 'إدارة المدن والشحن',
  can_manage_currencies: 'إدارة العملات',
  can_view_reports: 'عرض التقارير',
  can_export_data: 'تصدير البيانات',
};

const getRoleBadge = (role: UserRole) => {
  const roleMap: Record<UserRole, { label: string; color: string }> = {
    admin: { label: 'مدير', color: 'bg-red-100 text-red-700 border border-red-200' },
    editor: { label: 'محرر', color: 'bg-blue-100 text-blue-700 border border-blue-200' },
    viewer: { label: 'مشاهد', color: 'bg-gray-100 text-gray-700 border border-gray-200' },
    customer: { label: 'عميل', color: 'bg-green-100 text-green-700 border border-green-200' },
  };
  return roleMap[role] || roleMap.customer;
};

const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [permissions, setPermissions] = useState<UserPermissions>(defaultPermissions);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'customer' as UserRole,
  });

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    if (!isSupabaseConfigured()) {
      setUsers(mockUsers);
      setIsLoading(false);
      return;
    }
    try {
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error(err);
      setUsers(mockUsers);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const fetchUserPermissions = async (userId: string) => {
    if (!isSupabaseConfigured()) return;
    const { data } = await (supabase as any)
      .from('user_permissions')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (data) {
      const perms: UserPermissions = { ...defaultPermissions };
      Object.keys(defaultPermissions).forEach((key) => {
        (perms as any)[key] = data[key] ?? false;
      });
      setPermissions(perms);
    } else {
      setPermissions(defaultPermissions);
    }
  };

  const handleOpenModal = async (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        password: '',
        role: user.role,
      });
      await fetchUserPermissions(user.id);
    } else {
      setEditingUser(null);
      setFormData({ name: '', email: '', phone: '', password: '', role: 'customer' });
      setPermissions(defaultPermissions);
    }
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handlePermissionChange = (key: keyof UserPermissions, value: boolean) => {
    setPermissions(prev => ({ ...prev, [key]: value }));
  };

  const handleSelectAllPermissions = (select: boolean) => {
    const all = { ...defaultPermissions };
    Object.keys(all).forEach(k => { (all as any)[k] = select; });
    setPermissions(all);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!isSupabaseConfigured()) {
        // Demo mode
        if (editingUser) {
          setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...formData } : u));
          showToast('success', 'تم تحديث المستخدم بنجاح');
        } else {
          const newUser: User = {
            id: `user-${Date.now()}`,
            ...formData,
            created_at: new Date().toISOString(),
          };
          setUsers(prev => [newUser, ...prev]);
          showToast('success', 'تم إنشاء المستخدم بنجاح');
        }
        handleCloseModal();
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('غير مصرح له - يرجى إعادة تسجيل الدخول');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      if (editingUser) {
        // --- تعديل مستخدم موجود ---
        // Update profile directly
        const { error: profileError } = await (supabase as any)
          .from('profiles')
          .update({
            name: formData.name,
            phone: formData.phone || null,
            role: formData.role,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingUser.id);

        if (profileError) throw new Error('فشل في تحديث البيانات: ' + profileError.message);

        // Try edge function for password update if provided
        if (formData.password && formData.password.length >= 6) {
          try {
            await fetch(`${supabaseUrl}/functions/v1/update-user`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                userId: editingUser.id,
                password: formData.password,
              }),
            });
          } catch {
            // Password update via edge function failed, ignore
          }
        }

        showToast('success', 'تم تحديث المستخدم بنجاح ✓');
      } else {
        // --- إنشاء مستخدم جديد ---
        if (!formData.password || formData.password.length < 6) {
          throw new Error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        }
        if (!formData.email.includes('@')) {
          throw new Error('البريد الإلكتروني يجب أن يحتوي على @');
        }

        // Try Edge Function first (works without email confirmation)
        let createdViaEdge = false;
        try {
          const res = await fetch(`${supabaseUrl}/functions/v1/create-user`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              email: formData.email.trim().toLowerCase(),
              password: formData.password,
              name: formData.name,
              phone: formData.phone,
              role: formData.role,
            }),
          });
          const result = await res.json();
          if (res.ok && result.success) {
            createdViaEdge = true;
          }
        } catch {
          // Edge function not deployed, use fallback
        }

        if (!createdViaEdge) {
          // Fallback: Create via signUp + update profile
          const { data: newUser, error: signUpError } = await supabase.auth.signUp({
            email: formData.email.trim().toLowerCase(),
            password: formData.password,
            options: {
              data: { name: formData.name, phone: formData.phone },
            },
          });

          if (signUpError) {
            if (signUpError.message.includes('already registered')) {
              throw new Error('هذا البريد الإلكتروني مسجل مسبقاً');
            }
            throw new Error(signUpError.message);
          }

          if (newUser.user) {
            // Update profile with correct role
            await (supabase as any)
              .from('profiles')
              .upsert({
                id: newUser.user.id,
                email: formData.email.trim().toLowerCase(),
                name: formData.name,
                phone: formData.phone || null,
                role: formData.role,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
          }
        }

        showToast('success', `✓ تم إنشاء حساب ${formData.name} بنجاح`);
      }

      handleCloseModal();
      setTimeout(() => fetchUsers(), 1000);
    } catch (err: any) {
      showToast('error', err.message || 'حدث خطأ، يرجى المحاولة مرة أخرى');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (user.id === currentUser?.id) {
      showToast('error', 'لا يمكنك حذف حسابك الحالي');
      return;
    }
    if (user.role === 'admin') {
      showToast('error', 'لا يمكن حذف حساب المدير الرئيسي');
      return;
    }
    if (!confirm(`هل أنت متأكد من حذف المستخدم "${user.name}"؟`)) return;

    try {
      if (isSupabaseConfigured()) {
        const { data: { session } } = await supabase.auth.getSession();
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        await fetch(`${supabaseUrl}/functions/v1/update-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ userId: user.id, delete: true }),
        });
      }
      setUsers(prev => prev.filter(u => u.id !== user.id));
      showToast('success', 'تم حذف المستخدم بنجاح');
    } catch {
      showToast('error', 'فشل في حذف المستخدم');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = filterRole === 'all' || user.role === filterRole;
    return matchSearch && matchRole;
  });

  const counts = {
    all: users.length,
    admin: users.filter(u => u.role === 'admin').length,
    editor: users.filter(u => u.role === 'editor').length,
    viewer: users.filter(u => u.role === 'viewer').length,
    customer: users.filter(u => u.role === 'customer').length,
  };

  const isManagerRole = ['admin', 'editor'].includes(formData.role);

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-3 rounded-xl shadow-lg text-white font-medium transition-all ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة المستخدمين</h1>
          <p className="text-gray-500 mt-1">
            {users.length} مستخدم إجمالاً — {counts.customer} عميل — {counts.admin + counts.editor} مشرف
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchUsers}
            className="p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            title="تحديث"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition font-medium"
          >
            <Plus className="w-5 h-5" />
            إضافة مستخدم
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: 'الكل', count: counts.all },
          { key: 'admin', label: 'مدير', count: counts.admin },
          { key: 'editor', label: 'محرر', count: counts.editor },
          { key: 'viewer', label: 'مشاهد', count: counts.viewer },
          { key: 'customer', label: 'عملاء', count: counts.customer },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilterRole(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              filterRole === tab.key
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              filterRole === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="ابحث بالاسم أو البريد الإلكتروني..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>
      </div>

      {/* Users Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => {
            const badge = getRoleBadge(user.role);
            const isCurrentUser = user.id === currentUser?.id;
            return (
              <div
                key={user.id}
                className={`bg-white rounded-xl shadow-sm p-6 transition hover:shadow-md relative ${
                  isCurrentUser ? 'ring-2 ring-gray-900' : ''
                }`}
              >
                {isCurrentUser && (
                  <span className="absolute top-3 left-3 text-xs bg-gray-900 text-white px-2 py-0.5 rounded-full">
                    أنت
                  </span>
                )}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center text-lg font-bold text-gray-600">
                      {user.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{user.name}</h3>
                      <p className="text-sm text-gray-500 truncate max-w-[160px]">{user.email}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>

                <div className="space-y-1.5 text-sm text-gray-500 mb-4">
                  {user.phone && (
                    <p>📱 <span dir="ltr" className="text-gray-700">{user.phone}</span></p>
                  )}
                  <p>📅 {new Date(user.created_at).toLocaleDateString('ar-SA')}</p>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <button
                    onClick={() => handleOpenModal(user)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    تعديل
                  </button>
                  {!isCurrentUser && user.role !== 'admin' && (
                    <button
                      onClick={() => handleDelete(user)}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredUsers.length === 0 && (
            <div className="col-span-full bg-white rounded-xl shadow-sm p-16 text-center">
              <UsersIcon className="w-14 h-14 mx-auto text-gray-200 mb-4" />
              <p className="text-gray-500 text-lg">لا توجد نتائج</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                  <UsersIcon className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingUser ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}
                </h2>
              </div>
              <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">الاسم الكامل *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="مثال: أحمد محمد"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">البريد الإلكتروني *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@example.com"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-50"
                  required
                  disabled={!!editingUser}
                  dir="ltr"
                />
                {editingUser && (
                  <p className="text-xs text-gray-400 mt-1">لا يمكن تغيير البريد الإلكتروني</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">رقم الجوال</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="777123456"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  dir="ltr"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {editingUser ? 'كلمة مرور جديدة (اتركها فارغة للإبقاء على القديمة)' : 'كلمة المرور *'}
                </label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder={editingUser ? '••••••••' : 'أدخل كلمة مرور قوية'}
                    className="w-full pr-9 pl-10 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    required={!editingUser}
                    minLength={editingUser ? 0 : 6}
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {!editingUser && (
                  <p className="text-xs text-gray-400 mt-1">6 أحرف على الأقل</p>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">الدور الوظيفي *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
                >
                  <option value="customer">👤 عميل — وصول للمتجر فقط</option>
                  <option value="viewer">👁️ مشاهد — عرض لوحة الأدمن فقط</option>
                  <option value="editor">✏️ محرر — إدارة المحتوى</option>
                  <option value="admin">👑 مدير — صلاحيات كاملة</option>
                </select>
              </div>

              {/* Permissions (for editor/admin) */}
              {isManagerRole && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-800">الصلاحيات المخصصة</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleSelectAllPermissions(true)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        تحديد الكل
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        type="button"
                        onClick={() => handleSelectAllPermissions(false)}
                        className="text-xs text-gray-500 hover:underline"
                      >
                        إلغاء الكل
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {(Object.keys(permissionLabels) as (keyof UserPermissions)[]).map((key) => (
                      <label key={key} className="flex items-center gap-3 p-2.5 bg-white rounded-lg cursor-pointer hover:bg-blue-50 transition">
                        <input
                          type="checkbox"
                          checked={permissions[key]}
                          onChange={(e) => handlePermissionChange(key, e.target.checked)}
                          className="w-4 h-4 rounded accent-blue-600"
                        />
                        <span className="text-sm text-gray-700">{permissionLabels[key]}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition font-medium flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> جارٍ الحفظ...</>
                  ) : (
                    editingUser ? 'حفظ التغييرات' : 'إنشاء المستخدم'
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

export default UsersPage;
