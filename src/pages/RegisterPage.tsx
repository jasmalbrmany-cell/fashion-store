import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Lock, Phone, ShoppingBag, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const validate = () => {
    if (!formData.name.trim()) return 'يرجى إدخال الاسم الكامل';
    if (!formData.email.trim()) return 'يرجى إدخال البريد الإلكتروني';
    if (!/\S+@\S+\.\S+/.test(formData.email)) return 'البريد الإلكتروني غير صحيح';
    if (formData.password.length < 6) return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    if (formData.password !== formData.confirmPassword) return 'كلمتا المرور غير متطابقتين';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setIsLoading(true);
    setError('');

    try {
      if (!isSupabaseConfigured()) {
        // Demo mode
        await new Promise(r => setTimeout(r, 800));
        setSuccess(true);
        setTimeout(() => navigate('/'), 2000);
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { name: formData.name, phone: formData.phone },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('هذا البريد الإلكتروني مسجل مسبقاً');
        } else {
          setError(signUpError.message);
        }
        return;
      }

      if (data.user) {
        // Update profile with phone
        if (formData.phone) {
          await (supabase as any).from('profiles').update({
            phone: formData.phone,
            name: formData.name,
          }).eq('id', data.user.id);
        }

        setSuccess(true);
        // Auto-login
        setTimeout(async () => {
          const loggedIn = await login(formData.email, formData.password);
          if (loggedIn) navigate('/');
          else navigate('/login');
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ، يرجى المحاولة مرة أخرى');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 text-center max-w-sm w-full">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">تم التسجيل بنجاح!</h2>
          <p className="text-gray-500">مرحباً بك، {formData.name}!</p>
          <p className="text-sm text-gray-400 mt-2">جارٍ تسجيل دخولك...</p>
          <div className="mt-4 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 25px 25px, white 2px, transparent 0)',
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur rounded-2xl mb-4">
            <ShoppingBag className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">إنشاء حساب جديد</h1>
          <p className="text-gray-400 mt-2">انضم إلى مجتمع Fashion Hub</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {error && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">الاسم الكامل</label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="مثال: أحمد محمد"
                  className="w-full pr-10 pl-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pr-10 pl-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                  required
                  dir="ltr"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                رقم الجوال <span className="text-gray-400">(اختياري)</span>
              </label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="777123456"
                  className="w-full pr-10 pl-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="6 أحرف على الأقل"
                  className="w-full pr-10 pl-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                  required
                  minLength={6}
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">تأكيد كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  placeholder="أعد كتابة كلمة المرور"
                  className={`w-full pr-10 pl-10 py-3 border rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition ${
                    formData.confirmPassword && formData.password !== formData.confirmPassword
                      ? 'border-red-300 bg-red-50'
                      : formData.confirmPassword && formData.password === formData.confirmPassword
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-200'
                  }`}
                  required
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">كلمتا المرور غير متطابقتين</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gray-900 text-white rounded-xl hover:bg-gray-700 transition font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
            >
              {isLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> جارٍ إنشاء الحساب...</>
              ) : (
                'إنشاء الحساب'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-sm text-gray-400">لديك حساب بالفعل؟</span>
            </div>
          </div>

          <Link
            to="/login"
            className="block w-full py-3 text-center border-2 border-gray-900 text-gray-900 rounded-xl hover:bg-gray-900 hover:text-white transition font-semibold"
          >
            تسجيل الدخول
          </Link>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          بالتسجيل، أنت توافق على شروط الخدمة وسياسة الخصوصية
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
