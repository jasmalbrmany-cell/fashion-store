import React, { useState, useEffect } from 'react';
import { Search, Clock, Filter, Download, Loader2, RefreshCw } from 'lucide-react';
import { activityLogsService } from '@/services/api';
import { ActivityLog } from '@/types';
import { useLanguage } from '@/context/LanguageContext';

const ActivityPage: React.FC = () => {
  const { t, isRTL, language } = useLanguage();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUser, setFilterUser] = useState('');

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      const data = await activityLogsService.getRecent(100);
      setActivities(data || []);
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const filteredActivities = activities.filter(activity => {
    const matchesSearch =
      activity.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (activity.details && activity.details.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesUser = !filterUser || activity.userId === filterUser;
    return matchesSearch && matchesUser;
  });

  const uniqueUsers = [...new Set(activities.map(a => a.userId))];

  const getActionIcon = (action: string) => {
    if (action.includes('إضافة') || action.includes('Add') || action.includes('استيراد') || action.includes('Import')) {
      return 'bg-green-100 text-green-600';
    }
    if (action.includes('تعديل') || action.includes('Update') || action.includes('موافقة') || action.includes('Approve')) {
      return 'bg-blue-100 text-blue-600';
    }
    if (action.includes('حذف') || action.includes('Delete') || action.includes('إلغاء') || action.includes('Cancel')) {
      return 'bg-red-100 text-red-600';
    }
    return 'bg-gray-100 text-gray-600';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (mins < 5) return t.justNow;
    if (hours < 24) return isRTL ? `منذ ${hours} ${t.hoursAgo}` : `${hours} ${t.hoursAgo}`;
    if (days < 7) return isRTL ? `منذ ${days} ${t.daysAgo}` : `${days} ${t.daysAgo}`;
    return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US');
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.activityHistory}</h1>
          <p className="text-gray-500">{activities.length} {t.adsCount}</p>
        </div>
        <div className="flex gap-2">
            <button
                onClick={fetchActivities}
                className="p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
                <RefreshCw className={`w-5 h-5 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition font-bold shadow-lg">
                <Download className="w-5 h-5" />
                {t.exportReport}
            </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5`} />
            <input
              type="text"
              placeholder={t.searchActivities}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none`}
            />
          </div>
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none bg-white font-bold"
          >
            <option value="">{t.allUsers}</option>
            {uniqueUsers.map(userId => {
              const user = activities.find(a => a.userId === userId);
              return (
                <option key={userId} value={userId}>
                  {user?.userName}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Activities Timeline */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
        {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                <p className="text-gray-400 font-bold animate-pulse">{t.loading}</p>
            </div>
        ) : (
            <div className="divide-y divide-gray-100">
            {filteredActivities.map((activity) => (
                <div key={activity.id} className="p-4 hover:bg-gray-50 transition">
                <div className="flex gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getActionIcon(activity.action)}`}>
                    <Clock className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <p className={`text-sm font-bold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                        <span className="text-black underline decoration-gray-200 underline-offset-4">{activity.userName}</span>
                        {' '}
                        <span className="font-medium text-gray-600">{activity.action}</span>
                        </p>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">
                        {formatTime(activity.createdAt)}
                        </span>
                    </div>
                    {activity.details && (
                        <p className={`text-xs text-gray-500 font-medium ${isRTL ? 'text-right' : 'text-left'}`}>{activity.details}</p>
                    )}
                    </div>
                </div>
                </div>
            ))}

            {filteredActivities.length === 0 && (
                <div className="p-20 text-center opacity-40">
                <Clock className="w-12 h-12 mx-auto mb-4" />
                <p className="font-black uppercase tracking-widest text-xs">{isRTL ? 'لا توجد نشاطات' : 'No activities found'}</p>
                </div>
            )}
            </div>
        )}
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
            { label: t.totalActivities, value: activities.length, color: 'text-gray-900' },
            { label: t.additions, value: activities.filter(a => a.action.includes('إضافة') || a.action.includes('Add')).length, color: 'text-green-600' },
            { label: t.edits, value: activities.filter(a => a.action.includes('تعديل') || a.action.includes('Update')).length, color: 'text-blue-600' },
            { label: t.deletions_count, value: activities.filter(a => a.action.includes('حذف') || a.action.includes('Delete')).length, color: 'text-red-600' },
        ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm p-6 border text-center transition-transform hover:scale-105">
                <p className={`text-3xl font-black ${stat.color} tracking-tighter`}>{stat.value}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">{stat.label}</p>
            </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityPage;
