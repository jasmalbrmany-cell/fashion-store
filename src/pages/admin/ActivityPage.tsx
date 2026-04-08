import React, { useState } from 'react';
import { Search, Clock, Filter, Download } from 'lucide-react';
import { mockActivityLogs } from '@/data/mockData';
import { ActivityLog } from '@/types';

const ActivityPage: React.FC = () => {
  const [activities] = useState<ActivityLog[]>(mockActivityLogs);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUser, setFilterUser] = useState('');

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
    if (action.includes('إضافة') || action.includes('استيراد')) {
      return 'bg-green-100 text-green-600';
    }
    if (action.includes('تعديل') || action.includes('موافقة')) {
      return 'bg-blue-100 text-blue-600';
    }
    if (action.includes('حذف') || action.includes('إلغاء')) {
      return 'bg-red-100 text-red-600';
    }
    return 'bg-gray-100 text-gray-600';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'الآن';
    if (hours < 24) return `منذ ${hours} ساعة`;
    if (days < 7) return `منذ ${days} يوم`;
    return date.toLocaleDateString('ar-SA');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">سجل النشاطات</h1>
          <p className="text-gray-500">{activities.length} نشاط</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
          <Download className="w-5 h-5" />
          تصدير التقرير
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="ابحث في النشاطات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
          >
            <option value="">جميع المستخدمين</option>
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
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-200">
          {filteredActivities.map((activity) => (
            <div key={activity.id} className="p-4 hover:bg-gray-50 transition">
              <div className="flex gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getActionIcon(activity.action)}`}>
                  <Clock className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-medium text-gray-900">
                      <span className="text-primary-600">{activity.userName}</span>
                      {' '}
                      {activity.action}
                    </p>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {formatTime(activity.createdAt)}
                    </span>
                  </div>
                  {activity.details && (
                    <p className="text-sm text-gray-500">{activity.details}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredActivities.length === 0 && (
          <div className="p-12 text-center">
            <Clock className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">لا توجد نشاطات</p>
          </div>
        )}
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{activities.length}</p>
          <p className="text-sm text-gray-500">إجمالي النشاطات</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-green-600">
            {activities.filter(a => a.action.includes('إضافة')).length}
          </p>
          <p className="text-sm text-gray-500">إضافات</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">
            {activities.filter(a => a.action.includes('تعديل') || a.action.includes('موافقة')).length}
          </p>
          <p className="text-sm text-gray-500">تعديلات</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-red-600">
            {activities.filter(a => a.action.includes('حذف')).length}
          </p>
          <p className="text-sm text-gray-500">حذف</p>
        </div>
      </div>
    </div>
  );
};

export default ActivityPage;
