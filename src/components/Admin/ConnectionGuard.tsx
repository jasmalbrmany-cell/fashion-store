import React from 'react';
import { AlertCircle, ExternalLink, Key, ShieldAlert } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useLanguage } from '@/context/LanguageContext';

export const ConnectionGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isRTL } = useLanguage();
  const configured = isSupabaseConfigured();

  if (!configured) {
    return (
      <div className="p-8 bg-red-50 border-2 border-red-200 rounded-[2.5rem] space-y-6 animate-fadeIn" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="w-8 h-8 text-red-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-red-900 leading-tight">
              {isRTL ? 'فشل الاتصال بقاعدة البيانات' : 'Database Connection Failed'}
            </h2>
            <p className="text-red-700 font-bold leading-relaxed">
              {isRTL 
                ? 'يبدو أن مفاتيح الربط (Environment Variables) غير موجودة أو غير صحيحة في إعدادات Vercel. هذا هو السبب في عدم ظهور المنتجات والبيانات.' 
                : 'It seems that the environment variables (Supabase keys) are missing or incorrect in your Vercel settings. This is why products and data are not appearing.'}
            </p>
          </div>
        </div>

        <div className="bg-white/50 p-6 rounded-2xl border border-red-100 space-y-4">
          <p className="font-black text-xs uppercase tracking-widest text-red-400">
            {isRTL ? 'المفاتيح المطلوبة حالياً:' : 'Currently Missing Keys:'}
          </p>
          <ul className="space-y-2">
             {!import.meta.env.VITE_SUPABASE_URL && (
               <li className="flex items-center gap-2 text-sm font-bold text-red-600">
                 <AlertCircle className="w-4 h-4" /> VITE_SUPABASE_URL
               </li>
             )}
             {!import.meta.env.VITE_SUPABASE_ANON_KEY && (
               <li className="flex items-center gap-2 text-sm font-bold text-red-600">
                 <AlertCircle className="w-4 h-4" /> VITE_SUPABASE_ANON_KEY
               </li>
             )}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <a 
            href="https://vercel.com/dashboard" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-200"
          >
            <ExternalLink className="w-4 h-4" />
            {isRTL ? 'اذهب إلى Vercel Settings' : 'Go to Vercel Settings'}
          </a>
          <a 
            href="https://app.supabase.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-white text-red-600 border-2 border-red-100 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-50 transition-all"
          >
            <Key className="w-4 h-4" />
            {isRTL ? 'احصل على المفاتيح من Supabase' : 'Get keys from Supabase'}
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
