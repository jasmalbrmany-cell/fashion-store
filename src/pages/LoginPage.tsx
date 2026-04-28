import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();
  const { t, language } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError(t.enterEmail);
      return;
    }

    if (!password.trim()) {
      setError(t.enterPassword);
      return;
    }

    const result = await login(email, password);

    if (result.success) {
      // Read role from localStorage (freshly written by login())
      // with a small delay to ensure state is settled
      setTimeout(() => {
        try {
          const loggedInUser = JSON.parse(localStorage.getItem('fashionHubUser') || '{}');
          const role = (loggedInUser.role || '').toLowerCase();
          if (role === 'admin' || role === 'editor' || role === 'viewer') {
            navigate('/admin', { replace: true });
          } else {
            const redirectTo = (from && from !== '/login') ? from : '/my-orders';
            navigate(redirectTo, { replace: true });
          }
        } catch {
          navigate('/', { replace: true });
        }
      }, 100);
    } else {
      if (result.error === 'email_not_confirmed') {
        setError(
          language === 'ar'
            ? 'البريد الإلكتروني غير مؤكد. يرجى مراجعة بريدك وتأكيد الحساب أولاً، أو تواصل مع الدعم'
            : 'Email not confirmed. Please check your inbox or contact support'
        );
      } else if (result.error === 'قاعدة البيانات غير متصلة') {
        setError(language === 'ar' ? 'قاعدة البيانات غير متصلة' : 'Database not connected');
      } else if (result.error === 'timeout') {
        setError(language === 'ar' ? 'انتهى وقت الاتصال (Timeout). الخادم لا يستجيب.' : 'Connection timeout. Server not responding.');
      } else if (result.error?.startsWith('auth_error:')) {
        const msg = result.error.split(':')[1];
        setError(`رسالة من قاعدة البيانات: ${msg}`);
      } else if (result.error?.startsWith('unknown:')) {
        const msg = result.error.split(':')[1];
        setError(`خطأ غير معروف: ${msg}`);
      } else {
        setError(t.invalidCredentials);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* الشعار */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-block mb-4">
              <img src="/logo.jpg" alt="Fashion Hub" className="h-16 mx-auto" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.loginTitle}</h1>
            <p className="text-gray-500">{t.loginWelcome}</p>
          </div>

          {/* رسالة الخطأ */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* نموذج تسجيل الدخول */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* البريد الإلكتروني */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline ml-1" />
                {t.email}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                dir="ltr"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent focus:bg-white transition-all"
              />
            </div>

            {/* كلمة المرور */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="w-4 h-4 inline ml-1" />
                {t.password}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent focus:bg-white transition-all"
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

            {/* زر الدخول */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
            >
              {isLoading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t.loading}
                </>
              ) : (
                t.loginButton
              )}
            </button>
          </form>

          {/* روابط سفلية */}
          <div className="mt-6 flex flex-col gap-3 text-center text-sm">
            <p className="text-gray-500">
              {language === 'ar' ? 'ليس لديك حساب؟' : "Don't have an account?"}{' '}
              <Link to="/register" className="text-black font-bold hover:underline">
                {language === 'ar' ? 'إنشاء حساب جديد' : 'Create Account'}
              </Link>
            </p>
            
            {/* Help/Debug Section for login issues */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <button 
                type="button"
                onClick={() => {
                  const msg = language === 'ar' 
                    ? "إذا كنت متأكداً من كلمة المرور ولا يمكنك الدخول:\n1. تأكد من أن حسابك لديه صلاحية 'admin' في قاعدة البيانات.\n2. تأكد من جودة الاتصال بالإنترنت.\n3. حاول تسجيل الدخول من متصفح خفي (Incognito)."
                    : "If you are sure about your password but cannot enter:\n1. Ensure your account has 'admin' role in the database.\n2. Check your internet connection.\n3. Try logging in from an Incognito window.";
                  alert(msg);
                }}
                className="text-gray-400 hover:text-gray-600 underline text-xs"
              >
                {language === 'ar' ? 'هل تواجه مشكلة في الدخول؟' : 'Having trouble logging in?'}
              </button>
            </div>

            <Link to="/" className="text-gray-500 hover:text-black font-medium transition mt-2">
              {t.backToStore}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
