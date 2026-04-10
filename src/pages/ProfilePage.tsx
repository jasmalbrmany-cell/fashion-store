import React, { useState } from 'react';
import { User, Lock, Save, AlertCircle, CheckCircle2, Phone, Mail } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const ProfilePage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { t, isRTL } = useLanguage();
  
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);
    setMessage(null);

    // If Supabase is connected
    if (isSupabaseConfigured()) {
      try {
        // 1. Update Profile info in DB
        const { error: profileError } = await (supabase as any)
          .from('profiles')
          .update({ name, phone: phone || null })
          .eq('id', user.id);

        if (profileError) throw profileError;

        // 2. Update Password if provided
        if (newPassword) {
          if (!currentPassword) {
             throw new Error(isRTL ? 'يرجى إدخال كلمة المرور الحالية أولاً' : 'Please enter current password first');
          }
          if (newPassword === currentPassword) {
             throw new Error(isRTL ? 'يجب أن تكون كلمة المرور الجديدة مختلفة عن كلمة المرور الحالية' : 'New password must be different from current');
          }
          const { error: passwordError } = await supabase.auth.updateUser({
            password: newPassword
          });

          if (passwordError) {
             throw passwordError;
          }
        }

        setMessage({ type: 'success', text: isRTL ? 'تم حفظ التحديثات بنجاح!' : 'Profile updated successfully!' });
        
        // Clear passwords after update
        setCurrentPassword('');
        setNewPassword('');
        
        // Small reload to grab new context
        setTimeout(() => window.location.reload(), 1500);

      } catch (err: any) {
        console.error("Profile update error:", err);
        setMessage({ type: 'error', text: err?.message || (isRTL ? 'حدث خطأ أثناء التحديث.' : 'Error updating profile.') });
        setIsLoading(false);
        return; // Don't proceed to clear or reload
      }
    } else {
      // Demo Mode fallback
      const cached = localStorage.getItem('fashionHubUser');
      if (cached) {
         const parsed = JSON.parse(cached);
         parsed.name = name;
         parsed.phone = phone;
         localStorage.setItem('fashionHubUser', JSON.stringify(parsed));
         setMessage({ type: 'success', text: isRTL ? 'تم حفظ التحديثات مؤقتاً (وضع الديمو)!' : 'Demo profile updated!' });
         setTimeout(() => window.location.reload(), 1500);
      }
    }
    
    setIsLoading(false);
  };

  if (!user) return null;

  return (
    <div className={`min-h-[80vh] py-12 ${isAdmin ? 'bg-gray-50' : 'bg-gray-50'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center font-bold text-2xl shadow-lg">
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900">{isRTL ? 'الملف الشخصي' : 'My Profile'}</h1>
            <p className="text-gray-500 font-medium">#{user.role.toUpperCase()}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8">
            <form onSubmit={handleUpdateProfile} className="space-y-6">
               
               {message && (
                  <div className={`p-4 rounded-xl flex items-center gap-3 font-semibold ${
                    message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                     {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                     {message.text}
                  </div>
               )}

               <div className="grid md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-500 px-2">
                      {isRTL ? 'الاسم الكامل' : 'Full Name'}
                    </label>
                    <div className="relative">
                      <User className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-4' : 'left-4'} w-5 h-5 text-gray-400`} />
                      <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className={`w-full py-4 ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-black focus:ring-4 focus:ring-black/5 outline-none font-bold transition-all`}
                        placeholder={isRTL ? 'اسمك هنا' : 'Your name'}
                      />
                    </div>
                  </div>

                  {/* Mail (Read Only) */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-500 px-2">
                      {isRTL ? 'البريد الإلكتروني' : 'Email Address'}
                    </label>
                    <div className="relative">
                      <Mail className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-4' : 'left-4'} w-5 h-5 text-gray-400`} />
                      <input 
                        type="email" 
                        value={user.email}
                        disabled
                        className={`w-full py-4 ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} bg-gray-100 border border-transparent rounded-2xl text-gray-500 font-bold opacity-70 cursor-not-allowed`}
                      />
                    </div>
                  </div>
               </div>

               {/* Phone */}
               <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-gray-500 px-2">
                    {isRTL ? 'رقم الهاتف' : 'Phone Number'}
                  </label>
                  <div className="relative">
                    <Phone className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-4' : 'left-4'} w-5 h-5 text-gray-400`} />
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={`w-full py-4 ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-black focus:ring-4 focus:ring-black/5 outline-none font-bold transition-all`}
                      placeholder={isRTL ? '+96X XXX XXXX' : 'Your phone'}
                      dir="ltr"
                    />
                  </div>
               </div>

               <hr className="border-gray-100 my-8" />
               <div className="mb-2">
                 <h3 className="font-bold text-gray-900">{isRTL ? 'تغيير كلمة المرور' : 'Change Password'}</h3>
                 <p className="text-sm text-gray-500">{isRTL ? 'اترك الحقل فارغاً إذا لم ترغب بتغييرها.' : 'Leave blank if you do not want to change it.'}</p>
               </div>

               <div className="grid md:grid-cols-2 gap-6">
                 {/* Current Password */}
                 <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-500 px-2">
                      {isRTL ? 'كلمة المرور الحالية' : 'Current Password'}
                    </label>
                    <div className="relative">
                      <Lock className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-4' : 'left-4'} w-5 h-5 text-gray-400`} />
                      <input 
                        type="password" 
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className={`w-full py-4 ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-black focus:ring-4 focus:ring-black/5 outline-none font-bold transition-all`}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                 {/* New Password */}
                 <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-500 px-2">
                      {isRTL ? 'كلمة المرور الجديدة' : 'New Password'}
                    </label>
                    <div className="relative">
                      <Lock className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-4' : 'left-4'} w-5 h-5 text-gray-400`} />
                      <input 
                        type="password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        minLength={6}
                        className={`w-full py-4 ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-black focus:ring-4 focus:ring-black/5 outline-none font-bold transition-all`}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
               </div>

               <div className="pt-6">
                 <button 
                    type="submit" 
                    disabled={isLoading}
                    className="flex justify-center items-center gap-3 w-full p-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-colors shadow-lg disabled:opacity-50"
                 >
                    {isLoading ? (
                       <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                       <><Save className="w-5 h-5" /> {isRTL ? 'حفظ التغييرات' : 'Save Changes'}</>
                    )}
                 </button>
               </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
