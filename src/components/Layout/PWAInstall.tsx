import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const PWAInstall: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);
  const { t, isRTL } = useLanguage();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Auto show the banner after 3 seconds if not installed
      setTimeout(() => setShowInstall(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    setDeferredPrompt(null);
    setShowInstall(false);
  };

  if (!showInstall || !deferredPrompt) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[100] bg-black text-white px-4 py-3 shadow-xl transform transition-all duration-500 ease-in-out flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-sm tracking-tight">{isRTL ? 'إضافة المتجر للتطبيقات' : 'Install FashionHub App'}</p>
          <p className="text-xs text-white/70">{isRTL ? 'تصفح أسرع وتجربة أفضل بـ 10 مرات' : 'Faster browsing and 10x better experience'}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={handleInstall}
          className="bg-white text-black text-xs font-black px-4 py-2 rounded-lg hover:scale-105 active:scale-95 transition-all shadow-lg"
        >
          {isRTL ? 'تثبيت' : 'Install'}
        </button>
        <button 
          onClick={() => setShowInstall(false)}
          className="p-2 text-white/50 hover:text-white rounded-full bg-white/5"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default PWAInstall;
