// دالة غير متزامنة (Async) مسؤولة عن جلب بيانات المنتجات من أي رابط باستخدام الذكاء الاصطناعي
export async function scrapeWithFirecrawl(url: string, apiKey: string): Promise<any[]> {
  // نستخدم try...catch لالتقاط أي أخطاء قد تحدث أثناء الاتصال بالسيرفر الخارجي
  try {
    // إرسال طلب (POST) إلى واجهة برمجة تطبيقات Firecrawl
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // نوع البيانات المرسلة JSON
        'Authorization': `Bearer ${apiKey}` // إرسال مفتاح التحقق (API Key)
      },
      body: JSON.stringify({
        url, // الرابط المراد سحب بيانات المنتج منه
        formats: ['json'],
        // هنا نحدد الهيكل (Schema) الذي نريد من الذكاء الاصطناعي استخراجه من الصفحة
        jsonOptions: {
          schema: {
            type: 'object',
            properties: {
              products: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' }, // اسم المنتج
                    price: { type: 'number' }, // سعر المنتج
                    description: { type: 'string' }, // وصف المنتج
                    images: { type: 'array', items: { type: 'string' } }, // صور المنتج
                    sizes: { type: 'array', items: { type: 'string' } }, // المقاسات المتاحة
                    colors: { type: 'array', items: { type: 'string' } } // الألوان المتاحة
                  },
                  required: ['name', 'price'] // الحقول الإلزامية التي يجب استخراجها
                }
              }
            }
          }
        }
      })
    });

    // تحويل الرد القادم من السيرفر إلى صيغة JSON
    const data = await response.json();
    
    // التحقق من نجاح العملية ووجود بيانات للمنتجات
    if (data.success && data.data?.json?.products) {
      // إعادة تشكيل البيانات (Mapping) لتتوافق مع قاعدة بيانات المتجر الخاص بنا
      return data.data.json.products.map((p: any) => ({
        id: Math.random().toString(36).substr(2, 9), // توليد مُعرف (ID) عشوائي للمنتج
        name: p.name, // حفظ الاسم
        description: p.description || '', // حفظ الوصف أو ترك الحقل فارغاً إذا لم يوجد
        price: p.price, // حفظ السعر
        currency: 'USD', // تحديد العملة (سيتم تعديلها لاحقاً في المعالج الرئيسي)
        images: p.images || [], // حفظ الصور أو مصفوفة فارغة لتجنب الأخطاء
        sizes: p.sizes || ['حسب الطلب'], // حفظ المقاسات مع قيمة افتراضية "حسب الطلب"
        colors: (p.colors || []).map((c: string) => ({ name: c, hex: '#888888' })), // تشكيل الألوان
        sourceUrl: url, // حفظ الرابط الأصلي للمنتج
        category: '', // التصنيف (يُترك فارغاً مبدئياً)
      }));
    }
    return []; // إرجاع مصفوفة فارغة إذا لم نجد بيانات
  } catch (error) {
    // في حال حدوث خطأ (مثل انقطاع الإنترنت أو تعطل الـ API) يتم طباعته هنا
    console.error('Firecrawl scraping failed:', error);
    return []; // إرجاع مصفوفة فارغة لكي لا يتوقف النظام بالكامل
  }
}
