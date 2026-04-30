import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, Product, ProductSize, ProductColor } from '@/types';

// واجهة (Interface) تحدد شكل البيانات والدوال التي سيوفرها ملف الـ CartContext
interface CartContextType {
  items: CartItem[]; // مصفوفة تحتوي على المنتجات الموجودة في السلة حالياً
  isCartOpen: boolean; // حالة تفتح أو تغلق نافذة السلة الجانبية
  setIsCartOpen: (isOpen: boolean) => void; // دالة لتغيير حالة فتح وإغلاق السلة
  addItem: (product: Product, size?: ProductSize, color?: ProductColor, quantity?: number) => void; // دالة لإضافة منتج
  removeItem: (itemId: string) => void; // دالة لحذف منتج من السلة
  updateQuantity: (itemId: string, quantity: number) => void; // دالة لتحديث كمية منتج معين
  clearCart: () => void; // دالة لتفريغ السلة بالكامل
  getItemCount: () => number; // دالة لحساب إجمالي عدد القطع
  getSubtotal: () => number; // دالة لحساب التكلفة الإجمالية للمنتجات
}

// إنشاء الـ Context الذي سيسمح لنا بمشاركة هذه البيانات في أي مكان في التطبيق بدون الحاجة لتمريرها عبر الـ Props
const CartContext = createContext<CartContextType | undefined>(undefined);

// المُزوّد (Provider) هو المكون الذي يحيط بالتطبيق ويزوده ببيانات السلة
export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // حالة (State) لتخزين المنتجات، تبدأ بمصفوفة فارغة
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // useEffect هذه تعمل مرة واحدة عند فتح التطبيق، هدفها استرجاع السلة المحفوظة مسبقاً من ذاكرة المتصفح
  useEffect(() => {
    const savedCart = localStorage.getItem('fashionHubCart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart)); // تحويل النص إلى مصفوفة وتخزينها في الـ State
      } catch (e) {
        console.error('Error loading cart:', e);
      }
    }
  }, []);

  // useEffect هذه تعمل تلقائياً كلما تغيرت محتويات السلة (items) لتقوم بحفظها في ذاكرة المتصفح (LocalStorage)
  useEffect(() => {
    localStorage.setItem('fashionHubCart', JSON.stringify(items));
  }, [items]);

  // دالة إضافة منتج إلى السلة
  const addItem = (product: Product, size?: ProductSize, color?: ProductColor, quantity: number = 1) => {
    // بناء معرّف فريد (ID) للمنتج يعتمد على المنتج نفسه بالإضافة للحجم واللون 
    // (حتى لا يتم دمج نفس المنتج إذا اختلف مقاسه أو لونه)
    const itemId = `${product.id}-${size?.id || 'no-size'}-${color?.id || 'no-color'}`;
    const basePrice = product.price + (size?.priceModifier || 0); // حساب السعر النهائي بعد إضافة سعر المقاس إن وُجد

    setItems(prev => {
      // البحث هل المنتج بنفس اللون والمقاس موجود مسبقاً في السلة؟
      const existingIndex = prev.findIndex(item => item.id === itemId);

      // إذا كان موجوداً، نقوم فقط بزيادة الكمية ولا نضيف عنصراً جديداً
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      }

      // إذا لم يكن موجوداً، نقوم بتجهيز عنصر جديد وإضافته للمصفوفة
      const newItem: CartItem = {
        id: itemId,
        productId: product.id,
        product,
        size,
        color,
        quantity,
        price: basePrice,
      };

      return [...prev, newItem];
    });
  };

  // دالة حذف منتج بالاعتماد على الـ ID الخاص به
  const removeItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  // دالة تحديث الكمية (مثلاً عند الضغط على زر + أو -)
  const updateQuantity = (itemId: string, quantity: number) => {
    // إذا أصبحت الكمية صفر أو أقل، نحذف المنتج من السلة تلقائياً
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    setItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  // دالة تفريغ السلة بالكامل بعد إتمام الطلب بنجاح
  const clearCart = () => {
    setItems([]);
  };

  // دالة تحسب إجمالي عدد القطع الموجودة في السلة (لعرضها كـ Badge فوق أيقونة السلة)
  const getItemCount = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  // دالة تحسب التكلفة الإجمالية للمنتجات (الكمية × السعر)
  const getSubtotal = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  return (
    // تمرير كل الدوال والبيانات في الـ Provider لتصبح متاحة لكل مكونات التطبيق
    <CartContext.Provider
      value={{
        items,
        isCartOpen,
        setIsCartOpen,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getItemCount,
        getSubtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Custom Hook مخصص يسهل علينا استخدام بيانات السلة في أي ملف دون كتابة أكواد معقدة
export const useCart = () => {
  const context = useContext(CartContext);
  // التأكد من أننا نستخدم الـ Hook داخل المكونات المدعومة بالـ Provider
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
