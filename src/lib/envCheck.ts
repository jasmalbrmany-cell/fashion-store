/**
 * نظام فحص البيئة (Environment Check System)
 * يضمن هذا الملف أن المتغيرات الأساسية للمتجر موجودة وصحيحة قبل بدء التشغيل.
 */

export const validateEnv = () => {
  const required = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ];

  const missing = required.filter(key => !import.meta.env[key]);

  if (missing.length > 0) {
    console.error(
      '❌ خطأ حرج: متغيرات البيئة التالية مفقودة:\n' + 
      missing.join(', ') + 
      '\nيرجى إضافتها في Vercel Dashboard أو ملف .env'
    );
    return false;
  }

  return true;
};

export const getEnv = (key: string, defaultValue = ''): string => {
  return import.meta.env[key] || defaultValue;
};
