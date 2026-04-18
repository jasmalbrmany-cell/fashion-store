import React, { useState, useEffect } from 'react';
import {
  Plus, Pencil, Trash2, Loader2, FolderOpen, FolderTree,
  ChevronDown, ChevronRight, Tag, X, Save, AlertCircle
} from 'lucide-react';
import { categoriesService, clearCache } from '@/services/api';
import { Category } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { useNotificationContext } from '@/context/NotificationContext';

// ─── Available Icons list ──────────────────────────────────────
const ICON_OPTIONS = [
  { value: 'Shirt', label: '👕 قميص / Shirt' },
  { value: 'Footprints', label: '👟 حذاء' },
  { value: 'Watch', label: '⌚ ساعة' },
  { value: 'Briefcase', label: '💼 حقيبة' },
  { value: 'Flower', label: '🌸 عطر' },
  { value: 'Baby', label: '👶 أطفال' },
  { value: 'Gem', label: '💎 مجوهرات' },
  { value: 'Sun', label: '☀️ صيفي' },
  { value: 'Snowflake', label: '❄️ شتوي' },
  { value: 'Crown', label: '👑 فاخر' },
  { value: 'Star', label: '⭐ مميز' },
  { value: 'Heart', label: '❤️ هدايا' },
  { value: 'ShoppingBag', label: '🛍️ عروض' },
  { value: 'Glasses', label: '👓 نظارات' },
  { value: 'Layers', label: '📚 متنوع' },
  { value: 'Tag', label: '🏷️ تخفيضات' },
  { value: 'Zap', label: '⚡ جديد' },
  { value: 'Package', label: '📦 عام' },
];

// ─── CategoryFormModal Component ───────────────────────────────
interface CategoryFormModalProps {
  category?: Category | null;
  parentCategories: Category[];
  onClose: () => void;
  onSave: (data: Partial<Category>) => Promise<void>;
  isRTL: boolean;
  isSaving: boolean;
}

const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  category, parentCategories, onClose, onSave, isRTL, isSaving
}) => {
  const [name, setName] = useState(category?.name || '');
  const [nameEn, setNameEn] = useState('');
  const [icon, setIcon] = useState(category?.icon || 'Tag');
  const [parentId, setParentId] = useState(category?.parentId || '');
  const [order, setOrder] = useState(category?.order || 0);
  const isEdit = !!category;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onSave({
      name: name.trim(),
      icon,
      parentId: parentId || undefined,
      order,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center">
              <FolderTree className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black dark:text-white">
              {isEdit ? (isRTL ? 'تعديل القسم' : 'Edit Category') : (isRTL ? 'إضافة قسم جديد' : 'Add New Category')}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition">
            <X className="w-5 h-5 dark:text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Category Name */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400">
              {isRTL ? 'اسم القسم (عربي)' : 'Category Name (Arabic)'}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isRTL ? 'مثال: ملابس رجالية' : 'Example: Men Clothing'}
              required
              className="w-full px-5 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-black dark:focus:ring-white outline-none font-bold dark:text-white"
              dir="rtl"
            />
          </div>

          {/* Parent Category */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400">
              {isRTL ? 'ينتمي إلى (قسم أب)' : 'Parent Category (optional)'}
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full px-5 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-black dark:focus:ring-white outline-none font-bold dark:text-white"
            >
              <option value="">{isRTL ? '📁 قسم رئيسي (بدون أب)' : '📁 Root Category (no parent)'}</option>
              {parentCategories
                .filter(c => c.id !== category?.id) // can't be own parent
                .map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Icon */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400">
              {isRTL ? 'الأيقونة' : 'Icon'}
            </label>
            <select
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="w-full px-5 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-black dark:focus:ring-white outline-none font-bold dark:text-white"
            >
              {ICON_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Order */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400">
              {isRTL ? 'الترتيب (الأصغر يظهر أولاً)' : 'Sort Order (lower = first)'}
            </label>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
              min={0}
              className="w-full px-5 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-black dark:focus:ring-white outline-none font-bold dark:text-white"
            />
          </div>

          {/* Hint when creating subcategory */}
          {parentId && (
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
              <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
                {isRTL
                  ? `هذا قسم فرعي تابع لـ "${parentCategories.find(c=>c.id===parentId)?.name}". سيظهر داخله فقط.`
                  : `This is a sub-category under "${parentCategories.find(c=>c.id===parentId)?.name}".`}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-white rounded-2xl font-black hover:bg-gray-200 transition"
            >
              {isRTL ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSaving || !name.trim()}
              className="flex-1 py-3 bg-black text-white rounded-2xl font-black hover:bg-gray-800 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (isRTL ? 'حفظ القسم' : 'Save Category')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── CategoryRow Component ─────────────────────────────────────
interface CategoryRowProps {
  category: Category;
  children: Category[];
  isRTL: boolean;
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
  onAddChild: (parent: Category) => void;
  depth?: number;
}

const CategoryRowItem: React.FC<CategoryRowProps> = ({
  category, children, isRTL, onEdit, onDelete, onAddChild, depth = 0
}) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = children.length > 0;

  const iconEmoji = ICON_OPTIONS.find(o => o.value === category.icon)?.label?.split(' ')[0] || '📁';

  return (
    <div className={`${depth > 0 ? (isRTL ? 'mr-6 border-r-2 border-gray-100 dark:border-zinc-800 pr-4' : 'ml-6 border-l-2 border-gray-100 dark:border-zinc-800 pl-4') : ''}`}>
      <div className={`flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-800/60 transition group ${depth === 0 ? 'bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm mb-2' : 'mb-1'}`}>
        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className={`p-1 rounded-lg transition ${hasChildren ? 'text-gray-400 hover:text-black dark:hover:text-white' : 'opacity-0 pointer-events-none'}`}
        >
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {/* Icon */}
        <span className="text-xl w-8 text-center">{iconEmoji}</span>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <p className={`font-black text-gray-900 dark:text-white truncate ${depth === 0 ? 'text-base' : 'text-sm'}`}>
            {category.name}
          </p>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
            {hasChildren
              ? `${children.length} ${isRTL ? 'قسم فرعي' : 'subcategories'}`
              : (isRTL ? 'قسم فرعي' : 'subcategory')}
            {' · '}{isRTL ? 'ترتيب' : 'order'}: {category.order}
          </p>
        </div>

        {/* Badge */}
        {depth === 0 && (
          <span className="hidden sm:inline-block text-[10px] font-black px-2 py-1 bg-black text-white rounded-full uppercase tracking-widest">
            {isRTL ? 'رئيسي' : 'Parent'}
          </span>
        )}
        {depth > 0 && (
          <span className="hidden sm:inline-block text-[10px] font-black px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full uppercase tracking-widest">
            {isRTL ? 'فرعي' : 'Child'}
          </span>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {depth === 0 && (
            <button
              onClick={() => onAddChild(category)}
              title={isRTL ? 'إضافة قسم فرعي' : 'Add sub-category'}
              className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onEdit(category)}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(category)}
            className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div className="mt-1 mb-3">
          {children.map(child => (
            <CategoryRowItem
              key={child.id}
              category={child}
              children={[]}
              isRTL={isRTL}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Categories Page ──────────────────────────────────────
const CategoriesPage: React.FC = () => {
  const { isRTL } = useLanguage();
  const { showSuccess, showError } = useNotificationContext();

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [presetParentId, setPresetParentId] = useState<string>('');
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      clearCache('categories_all');
      const data = await categoriesService.getAll();
      setCategories(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadCategories(); }, []);

  // Organize into tree
  const parentCats = categories.filter(c => !c.parentId);
  const getChildren = (parentId: string) => categories.filter(c => c.parentId === parentId);

  const handleOpenAdd = () => {
    setEditCategory(null);
    setPresetParentId('');
    setShowModal(true);
  };

  const handleOpenAddChild = (parent: Category) => {
    setEditCategory(null);
    setPresetParentId(parent.id);
    setShowModal(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditCategory(cat);
    setPresetParentId('');
    setShowModal(true);
  };

  const handleSave = async (data: Partial<Category>) => {
    setIsSaving(true);
    try {
      // If adding child, inject presetParentId
      const payload = presetParentId && !editCategory
        ? { ...data, parentId: presetParentId }
        : data;

      if (editCategory) {
        const result = await categoriesService.update(editCategory.id, payload);
        if (result) {
          showSuccess('✅ ' + (isRTL ? 'تم تحديث القسم بنجاح' : 'Category Updated Successfully'));
          setShowModal(false);
          setEditCategory(null);
          await loadCategories();
        } else {
          showError('❌ ' + (isRTL ? 'فشل تحديث القسم - حاول مرة أخرى' : 'Failed to update category'));
        }
      } else {
        const result = await categoriesService.create(payload);
        if (result) {
          showSuccess('✅ ' + (isRTL ? 'تمت إضافة القسم بنجاح' : 'Category Added Successfully'));
          setShowModal(false);
          setEditCategory(null);
          await loadCategories();
        } else {
          showError('❌ ' + (isRTL ? 'فشل إنشاء القسم - حاول مرة أخرى' : 'Failed to create category'));
        }
      }
    } catch (e: any) {
      console.error('❌ Save error:', e);
      const errorMsg = e?.message || (isRTL ? 'فشل الحفظ - تحقق من الاتصال' : 'Save Failed - Check your connection');
      showError('❌ ' + errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const children = getChildren(deleteTarget.id);
    if (children.length > 0) {
      showError('❌ ' + (isRTL ? 'يجب حذف الأقسام الفرعية أولاً' : 'Please delete sub-categories first'));
      setDeleteTarget(null);
      return;
    }
    try {
      setIsSaving(true);
      await categoriesService.delete(deleteTarget.id);
      showSuccess('✅ ' + (isRTL ? 'تم حذف القسم بنجاح' : 'Category Deleted Successfully'));
      setDeleteTarget(null);
      await loadCategories();
    } catch (e: any) {
      console.error('❌ Delete error:', e);
      const errorMsg = e?.message || (isRTL ? 'فشل الحذف - تحقق من الاتصال' : 'Delete Failed - Check your connection');
      showError('❌ ' + errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const totalParents = parentCats.length;
  const totalChildren = categories.filter(c => !!c.parentId).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">
            {isRTL ? 'إدارة الأقسام' : 'Category Management'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-bold text-sm mt-1">
            {isRTL
              ? `${totalParents} قسم رئيسي · ${totalChildren} قسم فرعي`
              : `${totalParents} parent categories · ${totalChildren} sub-categories`}
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-2xl font-black hover:bg-gray-800 transition shadow-xl"
        >
          <Plus className="w-5 h-5" />
          {isRTL ? 'إضافة قسم' : 'Add Category'}
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: isRTL ? 'إجمالي الأقسام' : 'Total', value: categories.length, color: 'bg-black text-white', iconBg: 'bg-white/20' },
          { label: isRTL ? 'أقسام رئيسية' : 'Parents', value: totalParents, color: 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border', iconBg: 'bg-gray-100 dark:bg-zinc-800' },
          { label: isRTL ? 'أقسام فرعية' : 'Sub-categories', value: totalChildren, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border border-blue-100 dark:border-blue-800', iconBg: 'bg-blue-100 dark:bg-blue-900/30' },
        ].map((stat, i) => (
          <div key={i} className={`${stat.color} rounded-2xl p-4 shadow-sm flex items-center gap-3`}>
            <div className={`${stat.iconBg} p-2 rounded-xl`}>
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-black">{stat.value}</p>
              <p className="text-xs font-bold opacity-70 uppercase tracking-widest">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tree View */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-black dark:text-white" />
          <p className="font-bold text-gray-400 animate-pulse">{isRTL ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-gray-200 dark:border-zinc-700">
          <FolderTree className="w-16 h-16 text-gray-200 dark:text-zinc-700 mx-auto mb-4" />
          <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
            {isRTL ? 'لا توجد أقسام بعد' : 'No categories yet'}
          </h3>
          <p className="text-gray-500 font-bold text-sm mb-6">
            {isRTL ? 'ابدأ بإنشاء قسم رئيسي لتنظيم منتجاتك' : 'Create your first parent category to get started'}
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-8 py-3 bg-black text-white rounded-2xl font-black hover:bg-gray-800 transition"
          >
            {isRTL ? '+ إضافة أول قسم' : '+ Add First Category'}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {parentCats.map(parent => (
            <CategoryRowItem
              key={parent.id}
              category={parent}
              children={getChildren(parent.id)}
              isRTL={isRTL}
              onEdit={handleOpenEdit}
              onDelete={setDeleteTarget}
              onAddChild={handleOpenAddChild}
              depth={0}
            />
          ))}
          {/* Orphan children (parentId set but parent not found) */}
          {categories.filter(c => c.parentId && !categories.find(p => p.id === c.parentId)).map(orphan => (
            <div key={orphan.id} className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-orange-500 shrink-0" />
              <span className="font-bold text-orange-700 dark:text-orange-300 flex-1">{orphan.name}</span>
              <button onClick={() => handleOpenEdit(orphan)} className="p-2 hover:bg-orange-100 rounded-xl transition">
                <Pencil className="w-4 h-4 text-orange-600" />
              </button>
              <button onClick={() => setDeleteTarget(orphan)} className="p-2 hover:bg-red-50 rounded-xl transition">
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-gray-900 to-black text-white rounded-3xl p-6 flex items-start gap-4">
        <FolderTree className="w-8 h-8 shrink-0 opacity-60 mt-1" />
        <div>
          <h3 className="font-black text-lg mb-1">
            {isRTL ? 'كيف يعمل النظام الهرمي؟' : 'How does the hierarchy work?'}
          </h3>
          <p className="text-gray-300 text-sm leading-relaxed">
            {isRTL
              ? 'أنشئ أقساماً رئيسية مثل (ملابس رجالية) ثم أضف أقساماً فرعية مثل (أحذية، تيشرت، بناطيل). عند ضغط العميل على القسم الرئيسي يرى كل المنتجات، وعند ضغطه على الفرعي يرى الفلتر المحدد فقط.'
              : 'Create parent categories like "Men\'s Clothing" then add sub-categories like "Shoes", "T-Shirts", "Pants". Clicking a parent shows all products, clicking a child filters to that sub-category only.'}
          </p>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <CategoryFormModal
          category={editCategory}
          parentCategories={parentCats}
          onClose={() => { setShowModal(false); setEditCategory(null); setPresetParentId(''); }}
          onSave={handleSave}
          isRTL={isRTL}
          isSaving={isSaving}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
              {isRTL ? 'تأكيد الحذف' : 'Confirm Delete'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 font-bold text-sm mb-6">
              {isRTL
                ? `هل أنت متأكد من حذف قسم "${deleteTarget.name}"؟ لا يمكن التراجع عن هذا الإجراء.`
                : `Are you sure you want to delete "${deleteTarget.name}"? This cannot be undone.`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-white rounded-2xl font-black hover:bg-gray-200 transition"
              >
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 transition"
              >
                {isRTL ? 'حذف' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;
