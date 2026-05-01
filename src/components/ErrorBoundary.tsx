import React from 'react';
import { AlertTriangle, RefreshCw, Home, MessageCircle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: any;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-6 font-sans" dir="rtl">
          <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-zinc-100 dark:border-zinc-800 p-8 text-center space-y-6 animate-fadeIn">
            <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-10 h-10 text-amber-600 dark:text-amber-400" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-zinc-900 dark:text-white">حدث خطأ غير متوقع</h2>
              <p className="text-zinc-500 dark:text-zinc-400 font-bold leading-relaxed">
                نعتذر عن هذا الخلل. قد يكون هناك مشكلة في الاتصال أو تحديث جاري للموقع.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-2xl text-left text-xs font-mono overflow-auto max-h-32 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                {this.state.error?.message}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 pt-4">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center justify-center gap-2 bg-black dark:bg-white text-white dark:text-black py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                تحديث الصفحة
              </button>
              
              <a
                href="/"
                className="flex items-center justify-center gap-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
              >
                <Home className="w-4 h-4" />
                العودة للرئيسية
              </a>

              <a
                href="https://wa.me/967777123456"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors pt-4 text-xs font-bold"
              >
                <MessageCircle className="w-4 h-4" />
                تبليغ عن المشكلة عبر واتساب
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
