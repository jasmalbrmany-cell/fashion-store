# 🔒 دليل الأمان - Fashion Hub Store

## ✅ الإجراءات الأمنية المطبقة

### 1. حماية المفاتيح السرية
- ✅ جميع المفاتيح في `.env` (غير مرفوع إلى Git)
- ✅ `.env.example` يحتوي على قيم وهمية فقط
- ✅ `.gitignore` محدث لحماية الملفات الحساسة

### 2. Rate Limiting
```typescript
// API endpoints محمية بـ Rate Limiting
// 10 طلبات في الدقيقة لكل IP
```

**الملفات المحمية:**
- `/api/scrape.ts` - استيراد المنتجات
- `/api/catalog.ts` - قراءة الكتالوج

### 3. Row Level Security (RLS)
جميع جداول Supabase محمية بـ RLS:
- ✅ المستخدمون يرون بياناتهم فقط
- ✅ Admin يرى كل شيء
- ✅ Editor يدير المنتجات والطلبات
- ✅ Viewer يشاهد فقط

### 4. CORS Protection
```typescript
// CORS محدد للطلبات المسموحة فقط
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
```

---

## ⚠️ تحذيرات مهمة

### 🔴 لا تفعل أبداً:
1. ❌ رفع ملف `.env` إلى Git
2. ❌ مشاركة `SUPABASE_ANON_KEY` علناً
3. ❌ استخدام `SUPABASE_SERVICE_KEY` في Frontend
4. ❌ تعطيل RLS في الإنتاج
5. ❌ حفظ كلمات المرور في localStorage

### ✅ افعل دائماً:
1. ✅ استخدم Environment Variables
2. ✅ فعّل RLS على جميع الجداول
3. ✅ راجع Supabase Logs بانتظام
4. ✅ حدّث التبعيات بانتظام
5. ✅ استخدم HTTPS فقط

---

## 🛡️ أفضل الممارسات

### للمطورين:
```bash
# استخدم .env.local للتطوير المحلي
cp .env.example .env.local

# لا ترفع .env.local إلى Git
git status  # تأكد أن .env.local غير موجود
```

### للنشر:
```bash
# استخدم Environment Variables في Vercel
# لا تضع المفاتيح في الكود مباشرة
```

---

## 🔍 مراجعة الأمان

### شهرياً:
- [ ] راجع Supabase Auth Logs
- [ ] راجع API Usage
- [ ] تحقق من Rate Limiting Logs
- [ ] حدّث التبعيات (`pnpm update`)

### عند كل تحديث:
- [ ] اختبر RLS policies
- [ ] راجع الأكواد الجديدة
- [ ] اختبر Authentication
- [ ] تحقق من CORS settings

---

## 🚨 في حالة اختراق المفاتيح

### إذا تم تسريب SUPABASE_ANON_KEY:
1. اذهب إلى Supabase Dashboard
2. Settings → API
3. Reset anon key
4. حدّث Environment Variables في Vercel
5. أعد نشر الموقع

### إذا تم تسريب FIRECRAWL_API_KEY:
1. اذهب إلى Firecrawl Dashboard
2. Regenerate API Key
3. حدّث في Vercel
4. أعد النشر

---

## 📋 قائمة التحقق الأمني

قبل النشر:
- [ ] `.env` في `.gitignore`
- [ ] لا توجد مفاتيح في الكود
- [ ] RLS مفعّل على جميع الجداول
- [ ] Rate Limiting يعمل
- [ ] CORS محدد بشكل صحيح
- [ ] HTTPS مفعّل
- [ ] Environment Variables في Vercel

---

## 🔐 إدارة الصلاحيات

### الأدوار:
1. **Admin** - صلاحيات كاملة
2. **Editor** - إدارة المنتجات والطلبات
3. **Viewer** - مشاهدة فقط
4. **Customer** - الطلبات الخاصة فقط

### منح الصلاحيات:
```sql
-- في Supabase SQL Editor
INSERT INTO user_permissions (user_id, can_manage_products, can_manage_orders)
VALUES ('user-uuid-here', true, true);
```

---

## 📞 الإبلاغ عن مشاكل أمنية

إذا اكتشفت ثغرة أمنية:
1. **لا تنشرها علناً**
2. أرسل تقرير مفصل
3. انتظر الرد قبل الإفصاح

---

**🛡️ الأمان أولوية! حافظ على مفاتيحك آمنة.**
