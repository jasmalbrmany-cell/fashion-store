import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Store } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('يرجى إدخال البريد الإلكتروني');
      return;
    }

    if (!password.trim()) {
      setError('يرجى إدخال كلمة المرور');
      return;
    }

    const success = await login(email, password);

    if (success) {
      // Check user role and redirect accordingly
      const loggedInUser = JSON.parse(localStorage.getItem('fashionHubUser') || '{}');
      if (loggedInUser.role === 'admin' || loggedInUser.role === 'editor' || loggedInUser.role === 'viewer') {
        navigate('/admin', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } else {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            {/* Logo */}
            <Link to="/" className="inline-block mb-4">
              <img src="/logo.jpg" alt="Fashion Hub" className="h-16 mx-auto" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">تسجيل الدخول</h1>
            <p className="text-gray-500">مرحباً بعودتك! سجل دخولك للمتابعة</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline ml-1" />
                البريد الإلكتروني
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

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="w-4 h-4 inline ml-1" />
                كلمة المرور
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

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
            >
              {isLoading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  جاري التحميل...
                </>
              ) : (
                'تسجيل الدخول'
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 p-4 bg-gray-50 rounded-xl">
            <p className="text-sm font-medium text-gray-700 mb-3">بيانات تجريبية للدخول:</p>
            <div className="space-y-2">
              <button
                onClick={() => { setEmail('admin@fashionhub.com'); setPassword('demo123'); }}
                className="w-full text-left px-3 py-2 bg-white rounded-lg hover:bg-gray-100 transition flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900 text-sm">أدمن</p>
                  <p className="text-xs text-gray-500">admin@fashionhub.com</p>
                </div>
                <span className="text-xs bg-black text-white px-2 py-1 rounded">مدير</span>
              </button>
              <button
                onClick={() => { setEmail('editor@fashionhub.com'); setPassword('demo123'); }}
                className="w-full text-left px-3 py-2 bg-white rounded-lg hover:bg-gray-100 transition flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900 text-sm">محرر</p>
                  <p className="text-xs text-gray-500">editor@fashionhub.com</p>
                </div>
                <span className="text-xs bg-gray-700 text-white px-2 py-1 rounded">محرر</span>
              </button>
            </div>
            <p className="mt-3 text-xs text-gray-500 text-center">كلمة المرور للكل: demo123</p>
          </div>

          <p className="mt-6 text-center text-gray-500 text-sm">
            <Link to="/" className="text-black font-medium hover:underline">
              العودة للمتجر
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
