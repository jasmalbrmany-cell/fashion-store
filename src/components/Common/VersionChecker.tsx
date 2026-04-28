import React, { useState, useEffect } from 'react';
import { RefreshCw, X, Info } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const CURRENT_VERSION = '1.1.1'; // Change this manually when you want to trigger update

export const VersionChecker: React.FC = () => {
  const { isRTL } = useLanguage();
  const [hasUpdate, setHasUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const dismissedVersion = localStorage.getItem('dismissed_version');
        const res = await fetch(`/version.json?v=${Date.now()}`);
        if (!res.ok) return;
        const data = await res.json();
        
        if (data.version !== CURRENT_VERSION && data.version !== dismissedVersion) {
          setUpdateInfo(data);
          setHasUpdate(true);
          // Show with delay
          setTimeout(() => setIsVisible(true), 1500);
        }
      } catch (err) {
        console.warn('Failed to check version');
      }
    };

    checkVersion();
    // Check every 15 minutes
    const interval = setInterval(checkVersion, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!hasUpdate || !isVisible) return null;

  const handleUpdate = () => {
    if (updateInfo?.version) {
      localStorage.setItem('dismissed_version', updateInfo.version);
    }
    window.location.reload();
  };

  const handleDismiss = () => {
    if (updateInfo?.version) {
      localStorage.setItem('dismissed_version', updateInfo.version);
    }
    setIsVisible(false);
  };

  return (
    <div className={`fixed bottom-6 ${isRTL ? 'left-6' : 'right-6'} z-[9999] animate-in slide-in-from-bottom-10 duration-500`}>
      <div className="bg-black text-white p-6 rounded-3xl shadow-2xl border border-white/20 max-w-sm backdrop-blur-md">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/10 rounded-2xl">
            <RefreshCw className="w-6 h-6 animate-spin-slow" />
          </div>
          <div className="flex-1">
            <h4 className="font-black text-lg mb-1">
              {isRTL ? 'تحديث جديد متوفر!' : 'New Update Available!'}
            </h4>
            <p className="text-gray-400 text-sm mb-4">
              {updateInfo?.message || (isRTL ? 'تم إضافة ميزات جديدة وتحسينات للمتجر.' : 'New features and improvements have been added.')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleUpdate}
                className="flex-1 px-6 py-3 bg-white text-black rounded-xl font-black text-sm hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                {isRTL ? 'تحديث الآن' : 'Update Now'}
              </button>
              <button
                onClick={handleDismiss}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
};
