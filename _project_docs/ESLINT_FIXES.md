# 🔧 إصلاح أخطاء ESLint

## الأوامر المطلوبة

### 1. إصلاح تلقائي لجميع الأخطاء
```bash
cd extracted_project
pnpm lint --fix
```

### 2. عرض الأخطاء المتبقية
```bash
pnpm lint
```

---

## الأخطاء الشائعة المتوقعة

### 1. استيرادات غير مستخدمة
**مثال:**
```typescript
import { Loader2 } from 'lucide-react'; // غير مستخدم
```

**الحل:** حذف الاستيراد

### 2. كتل فارغة في catch
**مثال:**
```typescript
catch (err) {
  // كتلة فارغة
}
```

**الحل:** إضافة تعليق أو معالجة
```typescript
catch (err) {
  // Ignore error
}
```

### 3. تحذيرات React Hooks
**مثال:**
```typescript
useEffect(() => {
  // ...
}, []); // قد تكون هناك dependencies ناقصة
```

**الحل:** إضافة dependencies المطلوبة

---

## الملفات التي تحتاج إصلاح

- `src/App.tsx` - استيرادات غير مستخدمة
- `api/catalog.ts` - كتل فارغة
- `src/services/api.ts` - تحذيرات متعددة

---

## بعد الإصلاح

تأكد من:
1. ✅ عدم وجود أخطاء ESLint
2. ✅ البناء ينجح: `pnpm build`
3. ✅ التطبيق يعمل: `pnpm dev`
