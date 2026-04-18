import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Lock, Phone, ShoppingBag, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { usersService, withTimeout } from '@/services/api';

// Auto-format name: add space between words if typed without spaces
const formatName = (value: string): string => {
  // Add space before uppercase letters in Latin (e.g. "JohnDoe" -> "John Doe")
  let formatted = value.replace(/([a-z])([A-Z])/g, '$1 $2');
  // Normalize multiple spaces to single space
  formatted = formatted.replace(/\s+/g, ' ');
  return formatted;
};

// Validate email: must contain @ and a domain
const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { language } = useLanguage();

  const isAr = language === 'ar';

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
    // Auto-format name with spaces
    if (field === 'name') {
      value = formatName(value);
    }
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const validate = (): string | null => {
    if (!formData.name.trim()) {
      return isAr ? 'يرجى إدخال الاسم الكامل' : 'Please enter your full name';
    }
    if (!formData.email.trim()) {
      return isAr ? 'يرجى إدخال البريد الإلكتروني' : 'Please enter your email address';
    }
    if (!formData.email.includes('@')) {
      return isAr
        ? 'البريد الإلكتروني يجب أن يحتوي على @ (مثال: name@gmail.com)'
        : 'Email must contain @ (example: name@gmail.com)';
    }
    if (!isValidEmail(formData.email)) {
      return isAr
        ? 'صيغة البريد الإلكتروني غير صحيحة (مثال: name@gmail.com)'
        : 'Invalid email format (example: name@gmail.com)';
    }
    if (formData.password.length < 6) {
      return isAr
        ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
        : 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      return isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match';
    }
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
        await new Promise(r => setTimeout(r, 800));
        // Add user to the persistent mock data
        await usersService.create({
          email: formData.email.trim().toLowerCase(),
          name: formData.name.trim(),
          phone: formData.phone,
          role: 'customer'
        });
        
        setSuccess(true);
        setTimeout(() => navigate('/login'), 2000); // Navigate to login so they can sign in
        return;
      }

      const { data, error: signUpError } = await withTimeout(supabase.auth.signUp({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        options: {
          data: { name: formData.name.trim(), phone: formData.phone },
        },
      }), 12000);

      if (signUpError) {
        if (signUpError.message.includes('already registered') || signUpError.message.includes('already been registered')) {
          setError(isAr ? 'هذا البريد الإلكتروني مسجل مسبقاً' : 'This email is already registered');
        } else {
          setError(signUpError.message);
        }
        return;
      }

      if (data.user) {
        if (formData.phone) {
          await (supabase as any).from('profiles').update({
            phone: formData.phone,
            name: formData.name.trim(),
          }).eq('id', data.user.id);
        }

        setSuccess(true);
        setTimeout(async () => {
          const result = await login(formData.email, formData.password);
          if (result.success) navigate('/');
          else navigate('/login');
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || (isAr ? 'حدث خطأ، يرجى المحاولة مرة أخرى' : 'An error occurred, please try again'));
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isAr ? 'تم التسجيل بنجاح!' : 'Registration Successful!'}
          </h2>
          <p className="text-gray-500">
            {isAr ? `مرحباً بك، ${formData.name}!` : `Welcome, ${formData.name}!`}
          </p>
          <p className="text-sm text-gray-400 mt-2">
            {isAr ? 'جارٍ تسجيل دخولك...' : 'Logging you in...'}
          </p>
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
          <h1 className="text-3xl font-bold text-white">
            {isAr ? 'إنشاء حساب جديد' : 'Create Account'}
          </h1>
          <p className="text-gray-400 mt-2">
            {isAr ? 'انضم إلى مجتمع Fashion Hub' : 'Join the Fashion Hub community'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" dir={isAr ? 'rtl' : 'ltr'}>
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {isAr ? 'الاسم الكامل' : 'Full Name'}
              </label>
              <div className="relative">
                <User className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400`} />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder={isAr ? 'مثال: أحمد محمد' : 'Example: John Smith'}
                  className={`w-full ${isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition`}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {isAr ? 'البريد الإلكتروني' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400`} />
                <input
                  type="text"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="you@example.com"
                  className={`w-full ${isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition`}
                  required
                  dir="ltr"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {isAr ? 'يجب أن يحتوي على @ مثال: name@gmail.com' : 'Must contain @ example: name@gmail.com'}
              </p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {isAr ? 'رقم الجوال' : 'Phone Number'}{' '}
                <span className="text-gray-400">({isAr ? 'اختياري' : 'optional'})</span>
              </label>
              <div className="relative">
                <Phone className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400`} />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="777123456"
                  className={`w-full ${isAr ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition`}
                  dir="ltr"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {isAr ? 'كلمة المرور' : 'Password'}
              </label>
              <div className="relative">
                <Lock className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder={isAr ? '6 أحرف على الأقل' : 'At least 6 characters'}
                  className={`w-full ${isAr ? 'pr-10 pl-10' : 'pl-10 pr-10'} py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition`}
                  required
                  minLength={6}
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute ${isAr ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600`}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {isAr ? 'تأكيد كلمة المرور' : 'Confirm Password'}
              </label>
              <div className="relative">
                <Lock className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400`} />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  placeholder={isAr ? 'أعد كتابة كلمة المرور' : 'Re-enter your password'}
                  className={`w-full ${isAr ? 'pr-10 pl-10' : 'pl-10 pr-10'} py-3 border rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition ${
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
                  className={`absolute ${isAr ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600`}
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">
                  {isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gray-900 text-white rounded-xl hover:bg-gray-700 transition font-semibold text-base flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
            >
              {isLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> {isAr ? 'جارٍ إنشاء الحساب...' : 'Creating account...'}</>
              ) : (
                isAr ? 'إنشاء الحساب' : 'Create Account'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-sm text-gray-400">
                {isAr ? 'لديك حساب بالفعل؟' : 'Already have an account?'}
              </span>
            </div>
          </div>

          <Link
            to="/login"
            className="block w-full py-3 text-center border-2 border-gray-900 text-gray-900 rounded-xl hover:bg-gray-900 hover:text-white transition font-semibold"
          >
            {isAr ? 'تسجيل الدخول' : 'Sign In'}
          </Link>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          {isAr
            ? 'بالتسجيل، أنت توافق على شروط الخدمة وسياسة الخصوصية'
            : 'By registering, you agree to our Terms of Service and Privacy Policy'}
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
