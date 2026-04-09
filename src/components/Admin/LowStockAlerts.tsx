import React from 'react';
import { AlertTriangle, ArrowRight, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product } from '@/types';
import { useLanguage } from '@/context/LanguageContext';

interface LowStockAlertsProps {
  products: Product[];
  isLoading: boolean;
}

export const LowStockAlerts: React.FC<LowStockAlertsProps> = ({ products, isLoading }) => {
  const { t, isRTL } = useLanguage();
  const lowStockThreshold = 5;
  const lowStockItems = products.filter(p => p.stock <= lowStockThreshold && p.stock > 0);
  const outOfStockItems = products.filter(p => p.stock === 0);

  if (isLoading) return null;
  if (lowStockItems.length === 0 && outOfStockItems.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl border-2 border-red-100 overflow-hidden shadow-sm mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="bg-red-50 px-8 py-4 border-b border-red-100 flex items-center justify-between">
        <div className="flex items-center gap-3 text-red-700">
          <AlertTriangle className="w-5 h-5" />
          <h2 className="text-lg font-black tracking-tighter uppercase">{isRTL ? 'تنبيه المخزون' : 'Inventory Alerts'}</h2>
        </div>
        <Link to="/admin/products" className="text-[10px] font-black uppercase tracking-widest text-red-600 hover:underline flex items-center gap-1">
          {isRTL ? 'عرض الكل' : 'View All'}
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {outOfStockItems.map(item => (
            <Link key={item.id} to={`/admin/products/edit/${item.id}`} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-red-300 transition-all">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center font-black">0</div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-gray-900 truncate text-sm">{item.name}</p>
                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">{isRTL ? 'نفذ من المخزون' : 'Out of Stock'}</p>
              </div>
            </Link>
          ))}
          {lowStockItems.map(item => (
            <Link key={item.id} to={`/admin/products/edit/${item.id}`} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-orange-300 transition-all">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center font-black">{item.stock}</div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-gray-900 truncate text-sm">{item.name}</p>
                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">{isRTL ? 'مخزون منخفض' : 'Low Stock'}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
