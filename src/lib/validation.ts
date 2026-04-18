/**
 * Input Validation Utilities
 * Provides validation functions for common input types
 */

import { z } from 'zod';

// Email validation
export const emailSchema = z.string().email('بريد إلكتروني غير صحيح');

// Password validation (min 8 chars, at least one uppercase, one lowercase, one number)
export const passwordSchema = z
  .string()
  .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
  .regex(/[A-Z]/, 'يجب أن تحتوي على حرف كبير')
  .regex(/[a-z]/, 'يجب أن تحتوي على حرف صغير')
  .regex(/[0-9]/, 'يجب أن تحتوي على رقم');

// Phone validation (Yemen format)
export const phoneSchema = z
  .string()
  .regex(/^(967|0)?[0-9]{9}$/, 'رقم هاتف غير صحيح');

// URL validation
export const urlSchema = z.string().url('رابط غير صحيح');

// Product validation
export const productSchema = z.object({
  name: z.string().min(3, 'اسم المنتج يجب أن يكون 3 أحرف على الأقل'),
  description: z.string().optional(),
  price: z.number().positive('السعر يجب أن يكون موجباً'),
  category_id: z.string().uuid('معرف الفئة غير صحيح'),
  stock: z.number().nonnegative('المخزون لا يمكن أن يكون سالباً'),
});

// Order validation
export const orderSchema = z.object({
  customer_name: z.string().min(3, 'اسم العميل يجب أن يكون 3 أحرف على الأقل'),
  customer_phone: phoneSchema,
  city: z.string().min(2, 'المدينة مطلوبة'),
  address: z.string().optional(),
  items: z.array(z.object({
    product_id: z.string().uuid(),
    quantity: z.number().positive(),
    price: z.number().positive(),
  })).min(1, 'يجب أن يكون هناك منتج واحد على الأقل'),
});

// Login validation
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

// Register validation
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(3, 'الاسم يجب أن يكون 3 أحرف على الأقل'),
  phone: phoneSchema.optional(),
});

/**
 * Validate email
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  try {
    emailSchema.parse(email);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0].message };
    }
    return { valid: false, error: 'خطأ في التحقق' };
  }
}

/**
 * Validate password
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  try {
    passwordSchema.parse(password);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0].message };
    }
    return { valid: false, error: 'خطأ في التحقق' };
  }
}

/**
 * Validate phone number
 */
export function validatePhone(phone: string): { valid: boolean; error?: string } {
  try {
    phoneSchema.parse(phone);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0].message };
    }
    return { valid: false, error: 'خطأ في التحقق' };
  }
}

/**
 * Validate URL
 */
export function validateUrl(url: string): { valid: boolean; error?: string } {
  try {
    urlSchema.parse(url);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0].message };
    }
    return { valid: false, error: 'خطأ في التحقق' };
  }
}

/**
 * Sanitize string input (prevent XSS)
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate and sanitize product data
 */
export function validateProductData(data: any): { valid: boolean; error?: string; data?: any } {
  try {
    const validated = productSchema.parse(data);
    return { valid: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0].message };
    }
    return { valid: false, error: 'خطأ في التحقق' };
  }
}

/**
 * Validate and sanitize order data
 */
export function validateOrderData(data: any): { valid: boolean; error?: string; data?: any } {
  try {
    const validated = orderSchema.parse(data);
    return { valid: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: error.errors[0].message };
    }
    return { valid: false, error: 'خطأ في التحقق' };
  }
}
