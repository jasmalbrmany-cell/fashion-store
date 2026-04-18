# 🚨 الإجراءات الفورية المطلوبة

## ⏰ الأولوية: CRITICAL

---

## 1️⃣ إعادة تعيين مفاتيح Supabase (URGENT)

### الخطوة 1: اذهب إلى Supabase Dashboard
```
https://app.supabase.com/project/jkxfcyngiuefvaxswjxg/settings/api
```

### الخطوة 2: أعد تعيين المفاتيح
1. اضغط على "Reset" بجانب **anon key**
2. انسخ المفتاح الجديد
3. احفظه في مكان آمن

### الخطوة 3: حدّث .env.local
```bash
# افتح الملف
nano extracted_project/.env.local

# أو استخدم محرر النصوص المفضل لديك
# وحدّث:
VITE_SUPABASE_ANON_KEY=<المفتاح الجديد>
```

---

## 2️⃣ حذف الملف من Git History

### الخطوة 1: استخدم BFG Repo-Cleaner (الأسرع)
```bash
# ثبت BFG
brew install bfg  # macOS
# أو
apt-get install bfg  # Linux
# أو
choco install bfg  # Windows

# احذف الملف من التاريخ
cd extracted_project
bfg --delete-files .env.local
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### الخطوة 2: أو استخدم git filter-branch
```bash
cd extracted_project
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env.local" \
  --prune-empty --tag-name-filter cat -- --all
```

### الخطوة 3: فرض Push
```bash
git push origin --force --all
git push origin --force --tags
```

---

## 3️⃣ تحديث .gitignore

تأكد من أن `.gitignore` يحتوي على:
```
# Environment files
.env
.env.local
.env.*.local
.env.production
.env.development

# Supabase
.supabase/

# Secrets
secrets/
*.key
*.pem
```

**الحالة:** ✅ تم التحديث بالفعل

---

## 4️⃣ إنشاء Pre-commit Hook

```bash
cd extracted_project

# أنشئ الملف
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
if git diff --cached --name-only | grep -E '\.env|\.env\.local'; then
  echo "❌ Error: Attempting to commit .env files!"
  echo "Remove them from staging: git reset HEAD .env.local"
  exit 1
fi
EOF

# اجعله قابل للتنفيذ
chmod +x .git/hooks/pre-commit
```

---

## 5️⃣ مراجعة Supabase Logs

1. اذهب إلى Supabase Dashboard
2. اضغط على **Logs** في الشريط الجانبي
3. ابحث عن أي نشاط مريب
4. إذا وجدت نشاطاً غريباً:
   - غيّر كلمات مرور المستخدمين الإداريين
   - فعّل 2FA على حسابك

---

## 6️⃣ تحديث متغيرات البيئة في Vercel

1. اذهب إلى [Vercel Dashboard](https://vercel.com)
2. اختر المشروع
3. اذهب إلى **Settings → Environment Variables**
4. حدّث:
   - `VITE_SUPABASE_ANON_KEY` بالمفتاح الجديد
5. أعد النشر

---

## ✅ قائمة التحقق

- [ ] إعادة تعيين مفاتيح Supabase
- [ ] تحديث `.env.local` بالمفتاح الجديد
- [ ] حذف `.env.local` من Git history
- [ ] فرض Push للتغييرات
- [ ] إنشاء pre-commit hook
- [ ] مراجعة Supabase logs
- [ ] تحديث Vercel environment variables
- [ ] اختبار التطبيق

---

## ⏱️ الوقت المتوقع

- إعادة تعيين المفاتيح: **5 دقائق**
- حذف من Git: **10 دقائق**
- تحديث Vercel: **5 دقائق**
- **المجموع: ~20 دقيقة**

---

## 📞 إذا واجهت مشاكل

1. تحقق من Supabase Status: https://status.supabase.com
2. راجع Vercel Logs
3. تحقق من Browser Console للأخطاء

---

**⏰ الوقت حرج! نفذ هذه الخطوات فوراً!**
