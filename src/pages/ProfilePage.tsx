import React, { useState, useRef, useEffect } from 'react';
import { User, Lock, Save, AlertCircle, CheckCircle2, Phone, Mail, ChevronDown, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const countries = [
  { code: '+966', name: 'السعودية (SA)', enName: 'Saudi Arabia' },
  { code: '+971', name: 'الإمارات (AE)', enName: 'UAE' },
  { code: '+965', name: 'الكويت (KW)', enName: 'Kuwait' },
  { code: '+974', name: 'قطر (QA)', enName: 'Qatar' },
  { code: '+973', name: 'البحرين (BH)', enName: 'Bahrain' },
  { code: '+968', name: 'عمان (OM)', enName: 'Oman' },
  { code: '+967', name: 'اليمن (YE)', enName: 'Yemen' },
  { code: '+20', name: 'مصر (EG)', enName: 'Egypt' },
  { code: '+962', name: 'الأردن (JO)', enName: 'Jordan' },
  { code: '+1', name: 'أمريكا (US)', enName: 'USA' },
  { code: '+44', name: 'بريطانيا (UK)', enName: 'UK' },
];

const ProfilePage: React.FC = () => {
  const { user, isAdmin, updateUser } = useAuth();
  const { t, isRTL } = useLanguage();
  
  const [name, setName] = useState(user?.name || '');
  
  // Phone Parsing
  const existingPhone = user?.phone?.trim() || '';
  let initCountry = '+966';
  let initLocal = existingPhone;
  for (const c of countries) {
    if (existingPhone.startsWith(c.code)) {
      initCountry = c.code;
      initLocal = existingPhone.substring(c.code.length).trim();
      break;
    }
  }

  const [countryCode, setCountryCode] = useState(initCountry);
  const [localPhone, setLocalPhone] = useState(initLocal);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowCountryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);
    setMessage(null);

    const fullPhone = localPhone ? `${countryCode} ${localPhone}` : '';

    // If Supabase is connected
    if (isSupabaseConfigured()) {
      try {
        // 1. Update Profile info in DB
        const { error: profileError } = await (supabase as any)
          .from('profiles')
          .update({ name, phone: fullPhone || null })
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
        
        // Instant context & localstorage update without reloading
        updateUser({ name, phone: fullPhone || undefined });

        // Clear passwords after update
        setCurrentPassword('');
        setNewPassword('');

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
         updateUser({ name, phone: fullPhone || undefined });
         setMessage({ type: 'success', text: isRTL ? 'تم حفظ التحديثات مؤقتاً (وضع الديمو)!' : 'Demo profile updated!' });
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
               <div className="space-y-2 relative" ref={dropdownRef}>
                  <label className="text-xs font-black uppercase tracking-widest text-gray-500 px-2">
                    {isRTL ? 'رقم الهاتف' : 'Phone Number'}
                  </label>
                  <div className="flex gap-2">
                    {/* Country Code Dropdown */}
                    <div className="relative w-36 shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                        className={`w-full flex items-center justify-between py-4 px-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-black focus:ring-4 focus:ring-black/5 outline-none font-bold transition-all`}
                        dir="ltr"
                      >
                        <span>{countryCode}</span>
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </button>

                      {showCountryDropdown && (
                        <div className="absolute top-full mt-2 w-56 bg-white border rounded-xl shadow-xl z-50 overflow-hidden" style={{ [isRTL ? 'right' : 'left']: 0 }}>
                          <div className="p-2 border-b bg-gray-50 sticky top-0 flex items-center gap-2">
                            <Search className="w-4 h-4 text-gray-400 shrink-0" />
                            <input
                              type="text"
                              autoFocus
                              placeholder={isRTL ? "ابحث عن الدولة..." : "Search country..."}
                              value={countrySearch}
                              onChange={(e) => setCountrySearch(e.target.value)}
                              className="w-full bg-transparent border-none outline-none text-sm p-1"
                            />
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            {countries.filter(c => c.name.includes(countrySearch) || c.enName.toLowerCase().includes(countrySearch.toLowerCase()) || c.code.includes(countrySearch)).map(c => (
                              <button
                                key={c.code}
                                type="button"
                                onClick={() => {
                                  setCountryCode(c.code);
                                  setShowCountryDropdown(false);
                                  setCountrySearch('');
                                }}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between transition-colors"
                              >
                                <span className="font-semibold" dir={isRTL ? 'rtl' : 'ltr'}>{isRTL ? c.name : c.enName}</span>
                                <span className="text-gray-500 font-mono" dir="ltr">{c.code}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Local Phone Input */}
                    <div className="relative flex-1">
                      <input 
                        type="tel" 
                        value={localPhone}
                        onChange={(e) => setLocalPhone(e.target.value)}
                        className={`w-full py-4 pl-4 pr-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-black focus:ring-4 focus:ring-black/5 outline-none font-bold transition-all`}
                        placeholder="50 123 4567"
                        dir="ltr"
                      />
                    </div>
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
