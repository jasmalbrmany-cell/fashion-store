import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Edit, Trash2, Search, Users as UsersIcon,
  Shield, X, Loader2, RefreshCw, CheckCircle,
  AlertCircle, Eye, EyeOff, Lock, Filter
} from 'lucide-react';
import { User, UserRole } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { usersService, ordersService, hasValidCache, getCachedSync, clearCache } from '@/services/api';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/components/Common/Toast';

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

const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { t, language, isRTL } = useLanguage();
  const [users, setUsers] = useState<User[]>(getCachedSync<User[]>('users_all') || []);
  const [isLoading, setIsLoading] = useState(!hasValidCache('users_all'));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [permissions, setPermissions] = useState<UserPermissions>(defaultPermissions);
  const isVirtualCustomer = (userId: string) => userId.startsWith('guest:');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'customer' as UserRole,
  });

  const permissionLabels: Record<keyof UserPermissions, string> = {
    can_manage_products: t.inventoryManagement,
    can_manage_orders: t.adminOrders,
    can_manage_users: t.adminUsers,
    can_manage_ads: t.adminAds,
    can_manage_cities: t.adminCitiesTitle,
    can_manage_currencies: t.currenciesTitle,
    can_view_reports: t.viewReports,
    can_export_data: t.exportData,
  };



  const fetchUsers = useCallback(async () => {
    if (!hasValidCache('users_all')) {
        setIsLoading(true);
    }
    try {
      const [profileUsers, orders] = await Promise.all([
        usersService.getAll(),
        ordersService.getAll(),
      ]);

      const baseUsers = profileUsers || [];
      const customersByKey = new Map<string, User>();

      baseUsers
        .filter((u) => u.role === 'customer')
        .forEach((u) => {
          const emailKey = (u.email || '').trim().toLowerCase();
          const phoneKey = (u.phone || '').trim();
          if (emailKey) customersByKey.set(`email:${emailKey}`, u);
          if (phoneKey) customersByKey.set(`phone:${phoneKey}`, u);
        });

      // Include real customers who placed orders as guests and are not in profiles
      (orders || []).forEach((order) => {
        const emailInNotesMatch = (order.notes || '').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
        const inferredEmail = (emailInNotesMatch?.[0] || '').trim().toLowerCase();
        const phone = (order.customerPhone || '').trim();
        const hasExisting =
          (inferredEmail && customersByKey.has(`email:${inferredEmail}`)) ||
          (phone && customersByKey.has(`phone:${phone}`));

        if (hasExisting) return;

        const syntheticId = `guest:${phone || inferredEmail || order.orderNumber}`;
        const guestCustomer: User = {
          id: syntheticId,
          name: (order.customerName || 'Guest Customer').trim(),
          email: inferredEmail || `guest-${order.orderNumber.toLowerCase()}@local.customer`,
          phone: phone || undefined,
          role: 'customer',
          created_at: order.createdAt,
        };

        if (inferredEmail) customersByKey.set(`email:${inferredEmail}`, guestCustomer);
        if (phone) customersByKey.set(`phone:${phone}`, guestCustomer);
      });

      const dedupedGuestCustomers = Array.from(customersByKey.values()).filter(
        (u, index, arr) => arr.findIndex((x) => x.id === u.id) === index
      );

      const nonCustomerUsers = baseUsers.filter((u) => u.role !== 'customer');
      const combinedUsers = [...nonCustomerUsers, ...dedupedGuestCustomers].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setUsers(combinedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      setUsers([]);
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
    if (user && isVirtualCustomer(user.id)) {
      toast.error(isRTL ? 'تنبيه' : 'Notice', isRTL ? 'هذا عميل ضيف من الطلبات ولا يمكن تعديل حسابه قبل التسجيل.' : 'This is a guest customer from orders and cannot be edited before registration.');
      return;
    }
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
        if (editingUser) {
          await usersService.update(editingUser.id, formData);
          toast.success(isRTL ? 'نجاح' : 'Success', t.userUpdatedSuccess);
        } else {
          await usersService.create(formData);
          toast.success(isRTL ? 'نجاح' : 'Success', t.userCreatedSuccess);
        }
        await fetchUsers();
        handleCloseModal();
        setIsSubmitting(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error(t.unauthorizedError);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      if (editingUser) {
        const updatePassword = formData.password && formData.password.length >= 6 ? formData.password : undefined;
        
        // Update user completely via edge function to bypass RLS safely
        const res = await fetch(`${supabaseUrl}/functions/v1/update-user`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            userId: editingUser.id,
            name: formData.name,
            phone: formData.phone,
            role: formData.role,
            password: updatePassword,
            permissions: isManagerRole ? permissions : undefined
          }),
        });
        
        if (!res.ok) {
           const errData = await res.json().catch(() => ({}));
           throw new Error(errData.error || (isRTL ? 'فشل في تحديث المستخدم' : 'Failed to update user'));
        }

        toast.success(isRTL ? 'نجاح' : 'Success', t.userUpdatedSuccess);
      } else {
        if (!formData.password || formData.password.length < 6) {
          throw new Error(isRTL ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
        }

        let createdViaEdge = false;
        try {
          // Send permissions too!
          const res = await fetch(`${supabaseUrl}/functions/v1/create-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              email: formData.email.trim().toLowerCase(),
              password: formData.password,
              name: formData.name,
              phone: formData.phone,
              role: formData.role,
              permissions: permissions // <--- CRITICAL FIX: Send permissions
            }),
          });
          const result = await res.json();
          if (res.ok && result.success) createdViaEdge = true;
        } catch (e) {
          console.error('Failed to create user via edge function:', e);
        }

        if (!createdViaEdge) {
          const { data: newUser, error: signUpError } = await supabase.auth.signUp({
            email: formData.email.trim().toLowerCase(),
            password: formData.password,
            options: { data: { name: formData.name, phone: formData.phone } },
          });

          if (signUpError) throw new Error(signUpError.message);

          if (newUser.user) {
            await (supabase as any).from('profiles').upsert({
              id: newUser.user.id,
              email: formData.email.trim().toLowerCase(),
              name: formData.name,
              phone: formData.phone || null,
              role: formData.role,
            });
            
            if (isManagerRole) {
                await (supabase as any).from('user_permissions').upsert({
                    user_id: newUser.user.id,
                    ...permissions
                });
            }
          }
        }
        toast.success(isRTL ? 'نجاح' : 'Success', t.userCreatedSuccess);
      }

      clearCache('users_all');
      handleCloseModal();
      setTimeout(() => fetchUsers(), 100);
    } catch (err: any) {
      toast.error(isRTL ? 'خطأ' : 'Error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (isVirtualCustomer(user.id)) {
      toast.error(isRTL ? 'تنبيه' : 'Notice', isRTL ? 'لا يمكن حذف عميل ضيف من صفحة المستخدمين.' : 'Guest customers cannot be deleted from users list.');
      return;
    }
    if (user.id === currentUser?.id) {
      toast.error(isRTL ? 'خطأ' : 'Error', t.cannotDeleteSelf);
      return;
    }
    if (user.role === 'admin') {
      toast.error(isRTL ? 'خطأ' : 'Error', t.cannotDeleteAdmin);
      return;
    }
    if (!window.confirm(t.confirmDeleteUser + ` "${user.name}"?`)) return;

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
      toast.success(isRTL ? 'نجاح' : 'Success', t.userDeletedSuccess);
    } catch {
      toast.error(isRTL ? 'خطأ' : 'Error', isRTL ? 'فشل في حذف المستخدم' : 'Failed to delete user');
    }
  };

  const getRoleBadge = (role: UserRole) => {
    const roleMap: Record<UserRole, { label: string; color: string }> = {
      admin: { label: t.adminRole, color: 'bg-red-50 text-red-600 border border-red-100 shadow-sm shadow-red-50' },
      editor: { label: t.editorRole, color: 'bg-blue-50 text-blue-600 border border-blue-100 shadow-sm shadow-blue-50' },
      viewer: { label: t.viewerRole, color: 'bg-gray-50 text-gray-600 border border-gray-100 shadow-sm shadow-gray-50' },
      customer: { label: t.customerRole, color: 'bg-green-50 text-green-600 border border-green-100 shadow-sm shadow-green-50' },
    };
    return roleMap[role] || roleMap.customer;
  };

  const filteredUsers = users.filter(user => {
    const matchSearch = (user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchQuery.toLowerCase());
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
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">{t.adminUsersTitle}</h1>
          <p className="text-gray-500 font-bold mt-1">
            {users.length} {t.totalUsersDesc} — {counts.customer} {t.customersCount} — {counts.admin + counts.editor} {t.adminsCount}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchUsers}
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
            {t.addUser}
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Row */}
      <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex gap-2 flex-wrap overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
            {[
              { key: 'all', label: isRTL ? 'الكل' : 'All', count: counts.all, icon: <Filter className="w-3.5 h-3.5" /> },
              { key: 'admin', label: t.adminRole, count: counts.admin, icon: <Shield className="w-3.5 h-3.5" /> },
              { key: 'editor', label: t.editorRole, count: counts.editor, icon: <Edit className="w-3.5 h-3.5" /> },
              { key: 'viewer', label: t.viewerRole, count: counts.viewer, icon: <Eye className="w-3.5 h-3.5" /> },
              { key: 'customer', label: t.customerRole, count: counts.customer, icon: <UsersIcon className="w-3.5 h-3.5" /> },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilterRole(tab.key)}
                className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  filterRole === tab.key
                    ? 'bg-black text-white shadow-lg shadow-gray-200'
                    : 'bg-white border border-gray-100 text-gray-500 hover:bg-gray-50 hover:text-black hover:border-gray-200'
                }`}
              >
                {tab.icon}
                {tab.label}
                <span className={`px-2 py-0.5 rounded-full font-black ${
                  filterRole === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="bg-white rounded-[1.5rem] shadow-sm border p-2 flex-1">
            <div className="relative">
              <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5`} />
              <input
                type="text"
                placeholder={t.searchUserPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full ${isRTL ? 'pr-12' : 'pl-12'} py-3 bg-gray-50 border border-gray-50 rounded-[1.25rem] focus:ring-2 focus:ring-black outline-none font-bold`}
              />
            </div>
          </div>
      </div>

      {/* Users Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-black" />
          <p className="text-gray-400 font-black animate-pulse">{t.loading}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => {
            const badge = getRoleBadge(user.role);
            const isCurrentUser = user.id === currentUser?.id;
            const isGuest = isVirtualCustomer(user.id);
            return (
              <div
                key={user.id}
                className={`bg-white rounded-[2rem] shadow-sm p-8 transition-all hover:shadow-md border group relative flex flex-col gap-6 ${
                  isCurrentUser ? 'border-black ring-1 ring-black/5' : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                {isCurrentUser && (
                  <span className={`absolute top-4 ${isRTL ? 'left-6' : 'right-6'} text-[9px] font-black uppercase tracking-widest bg-black text-white px-3 py-1 rounded-full shadow-lg z-10`}>
                    {t.you}
                  </span>
                )}
                
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center text-2xl font-black text-gray-400 group-hover:bg-black group-hover:text-white group-hover:scale-110 transition-all duration-300">
                      {(user.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="font-black text-gray-900 text-lg leading-tight truncate">{user.name}</h3>
                      <p className="text-xs text-gray-400 font-bold truncate mt-1">{user.email}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${badge.color}`}>
                        {badge.label}
                    </span>
                    {isGuest && (
                      <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-[10px] font-black uppercase tracking-widest">
                        {isRTL ? 'عميل ضيف (من الطلبات)' : 'Guest customer (from orders)'}
                      </span>
                    )}
                    {user.phone && (
                        <span className="px-3 py-1 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black text-gray-600" dir="ltr">{user.phone}</span>
                    )}
                </div>

                <div className="mt-auto pt-6 border-t border-gray-50 flex gap-2">
                  <button
                    onClick={() => handleOpenModal(user)}
                    disabled={isGuest}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 text-gray-700 rounded-2xl hover:bg-black hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-transparent hover:border-black"
                  >
                    <Edit className="w-4 h-4" />
                    {t.edit}
                  </button>
                  {!isCurrentUser && user.role !== 'admin' && (
                    <button
                      onClick={() => handleDelete(user)}
                      className="px-4 py-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all border border-transparent hover:border-red-100"
                      aria-label={t.delete}
                      title={t.delete}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredUsers.length === 0 && (
            <div className="col-span-full bg-white rounded-[2.5rem] shadow-sm p-24 text-center border border-dashed border-gray-200">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                 <UsersIcon className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-gray-400 font-black text-xl">{isRTL ? 'لا توجد نتائج بحث' : 'No users found'}</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-8 border-b bg-gray-50/50">
              <h2 className="text-2xl font-black text-gray-900 leading-tight flex items-center gap-3">
                <div className="p-2 bg-black text-white rounded-xl shadow-lg">
                    <UsersIcon className="w-6 h-6" />
                </div>
                {editingUser ? t.editUser : t.addUser}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-3 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-gray-100"
                aria-label={isRTL ? 'إغلاق النافذة' : 'Close modal'}
                title={isRTL ? 'إغلاق النافذة' : 'Close modal'}
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid gap-6">
                  {/* Name */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2">{t.fullName} *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder={isRTL ? 'مثال: أحمد محمد' : 'e.g. John Doe'}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black outline-none font-bold"
                      required
                    />
                  </div>

                  {/* Email & Phone Row */}
                  <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2">{t.emailLabel} *</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="email@example.com"
                          className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black outline-none font-bold disabled:opacity-50 shadow-sm"
                          required
                          disabled={!!editingUser}
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2">{t.phoneLabel}</label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="777123456"
                          className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black outline-none font-bold shadow-sm"
                          dir="ltr"
                        />
                      </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2">
                      {editingUser ? (isRTL ? 'كلمة مرور جديدة (اختياري)' : 'New password (optional)') : t.passwordLabel + ' *'}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="••••••••"
                        className={`w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black outline-none font-black tracking-widest shadow-sm`}
                        required={!editingUser}
                        minLength={6}
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition`}
                        aria-label={showPassword ? (isRTL ? 'إخفاء كلمة المرور' : 'Hide password') : (isRTL ? 'إظهار كلمة المرور' : 'Show password')}
                        title={showPassword ? (isRTL ? 'إخفاء كلمة المرور' : 'Hide password') : (isRTL ? 'إظهار كلمة المرور' : 'Show password')}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Role */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2">{t.roleLabel} *</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as UserRole }))}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-black outline-none font-black shadow-sm"
                      aria-label={t.roleLabel}
                      title={t.roleLabel}
                    >
                      <option value="customer">{isRTL ? '📦 عميل (طلب فقط)' : '📦 Customer'}</option>
                      <option value="viewer">{isRTL ? '👁️ مشاهد (قراءة فقط)' : '👁️ Viewer'}</option>
                      <option value="editor">{isRTL ? '✏️ محرر (إدارة المحتوى)' : '✏️ Editor'}</option>
                      <option value="admin">{isRTL ? '👑 مسؤول (صلاحية كاملة)' : '👑 Administrator'}</option>
                    </select>
                  </div>
              </div>

              {/* Permissions */}
              {isManagerRole && (
                <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 space-y-6 shadow-inner">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-gray-100 shadow-sm">
                        <Shield className="w-4 h-4 text-black" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">{t.permissionsLabel}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => handleSelectAllPermissions(true)}
                        className="text-[9px] font-black uppercase tracking-widest text-black hover:bg-black hover:text-white px-3 py-1.5 rounded-lg border border-black/5 transition"
                      >
                        {t.selectAll}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectAllPermissions(false)}
                        className="text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-transparent transition"
                      >
                        {t.deselectAll}
                      </button>
                    </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    {(Object.keys(permissionLabels) as (keyof UserPermissions)[]).map((key) => (
                      <label key={key} className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl cursor-pointer hover:border-black transition-all group shadow-sm">
                        <input
                          type="checkbox"
                          checked={permissions[key]}
                          onChange={(e) => handlePermissionChange(key, e.target.checked)}
                          className="w-5 h-5 rounded border-gray-300 accent-black cursor-pointer"
                        />
                        <span className="text-[11px] font-black text-gray-600 group-hover:text-black transition-colors">{permissionLabels[key]}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Modal Actions */}
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
                  className="flex-1 py-4 bg-black text-white rounded-2xl hover:bg-gray-800 transition font-black flex items-center justify-center gap-2 disabled:opacity-50 shadow-2xl shadow-gray-200 uppercase tracking-widest text-sm"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> {t.saving}</>
                  ) : (
                    editingUser ? t.saveChanges : t.addUser
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
