import { z } from 'zod';

/**
 * Validation schemas for API endpoints
 */

// Product import validation
export const ImportProductSchema = z.object({
  url: z.string()
    .url('URL غير صحيح')
    .min(10, 'الرابط قصير جداً')
    .max(2048, 'الرابط طويل جداً'),
  page: z.number()
    .int('الصفحة يجب أن تكون رقم صحيح')
    .positive('الصفحة يجب أن تكون موجبة')
    .optional()
    .default(1),
});

// Product data validation
export const ProductSchema = z.object({
  id: z.string().optional(),
  name: z.string()
    .min(3, 'اسم المنتج قصير جداً (3 أحرف على الأقل)')
    .max(255, 'اسم المنتج طويل جداً'),
  description: z.string()
    .max(2000, 'الوصف طويل جداً')
    .optional(),
  price: z.number()
    .positive('السعر يجب أن يكون موجب')
    .finite('السعر يجب أن يكون رقم صحيح'),
  currency: z.string()
    .length(3, 'رمز العملة يجب أن يكون 3 أحرف')
    .optional()
    .default('SAR'),
  images: z.array(
    z.string().url('رابط الصورة غير صحيح')
  ).optional().default([]),
  sizes: z.array(z.string()).optional().default([]),
  colors: z.array(
    z.object({
      name: z.string(),
      hex: z.string().regex(/^#[0-9A-F]{6}$/i, 'لون غير صحيح'),
    })
  ).optional().default([]),
  stock: z.number()
    .int('المخزون يجب أن يكون رقم صحيح')
    .nonnegative('المخزون لا يمكن أن يكون سالب')
    .optional()
    .default(0),
  sourceUrl: z.string().url().optional(),
  category: z.string().optional(),
});

// Scrape request validation
export const ScrapeRequestSchema = z.object({
  url: z.string()
    .url('URL غير صحيح')
    .min(10, 'الرابط قصير جداً'),
  timeout: z.number()
    .positive('المهلة الزمنية يجب أن تكون موجبة')
    .optional()
    .default(12000),
});

// Catalog import validation
export const CatalogImportSchema = z.object({
  url: z.string()
    .url('URL غير صحيح')
    .min(10, 'الرابط قصير جداً'),
  page: z.number()
    .int('الصفحة يجب أن تكون رقم صحيح')
    .positive('الصفحة يجب أن تكون موجبة')
    .optional()
    .default(1),
  strategy: z.enum([
    'auto',
    'woocommerce',
    'shopify',
    'shein',
    'scrape',
  ]).optional().default('auto'),
});

// Validation helper
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { valid: true; data: T } | { valid: false; error: string } {
  try {
    const validated = schema.parse(data);
    return { valid: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return { valid: false, error: messages };
    }
    return { valid: false, error: 'خطأ في التحقق من البيانات' };
  }
}

// Type exports
export type ImportProduct = z.infer<typeof ImportProductSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type ScrapeRequest = z.infer<typeof ScrapeRequestSchema>;
export type CatalogImport = z.infer<typeof CatalogImportSchema>;
