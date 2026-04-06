// Database types matching Supabase schema
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          phone: string | null;
          role: 'admin' | 'editor' | 'viewer' | 'customer';
          avatar: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          phone?: string | null;
          role?: 'admin' | 'editor' | 'viewer' | 'customer';
          avatar?: string | null;
        };
        Update: {
          email?: string;
          name?: string;
          phone?: string | null;
          role?: 'admin' | 'editor' | 'viewer' | 'customer';
          avatar?: string | null;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          icon: string | null;
          parent_id: string | null;
          order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          icon?: string | null;
          parent_id?: string | null;
          order?: number;
        };
        Update: {
          name?: string;
          icon?: string | null;
          parent_id?: string | null;
          order?: number;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price: number;
          category_id: string | null;
          images: ProductImage[];
          sizes: ProductSize[];
          colors: ProductColor[];
          stock: number;
          is_visible: boolean;
          source_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          price: number;
          category_id?: string | null;
          images?: ProductImage[];
          sizes?: ProductSize[];
          colors?: ProductColor[];
          stock?: number;
          is_visible?: boolean;
          source_url?: string | null;
        };
        Update: {
          name?: string;
          description?: string | null;
          price?: number;
          category_id?: string | null;
          images?: ProductImage[];
          sizes?: ProductSize[];
          colors?: ProductColor[];
          stock?: number;
          is_visible?: boolean;
          source_url?: string | null;
          updated_at?: string;
        };
      };
      cities: {
        Row: {
          id: string;
          name: string;
          shipping_cost: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          shipping_cost: number;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          shipping_cost?: number;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      currencies: {
        Row: {
          id: string;
          code: string;
          name: string;
          exchange_rate: number;
          symbol: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          exchange_rate: number;
          symbol: string;
        };
        Update: {
          code?: string;
          name?: string;
          exchange_rate?: number;
          symbol?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          customer_name: string;
          customer_phone: string;
          customer_id: string | null;
          city: string;
          address: string | null;
          items: OrderItem[];
          subtotal: number;
          shipping_cost: number;
          total: number;
          status: OrderStatus;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number: string;
          customer_name: string;
          customer_phone: string;
          customer_id?: string | null;
          city: string;
          address?: string | null;
          items: OrderItem[];
          subtotal: number;
          shipping_cost: number;
          total: number;
          status?: OrderStatus;
          notes?: string | null;
        };
        Update: {
          customer_name?: string;
          customer_phone?: string;
          city?: string;
          address?: string | null;
          items?: OrderItem[];
          subtotal?: number;
          shipping_cost?: number;
          total?: number;
          status?: OrderStatus;
          notes?: string | null;
          updated_at?: string;
        };
      };
      ads: {
        Row: {
          id: string;
          title: string;
          type: 'image' | 'video' | 'text';
          content: string | null;
          image_url: string | null;
          video_url: string | null;
          link: string | null;
          position: 'top' | 'bottom' | 'sidebar' | 'inline' | 'popup';
          is_active: boolean;
          start_date: string | null;
          end_date: string | null;
          order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          type?: 'image' | 'video' | 'text';
          content?: string | null;
          image_url?: string | null;
          video_url?: string | null;
          link?: string | null;
          position?: 'top' | 'bottom' | 'sidebar' | 'inline' | 'popup';
          is_active?: boolean;
          start_date?: string | null;
          end_date?: string | null;
          order?: number;
        };
        Update: {
          title?: string;
          type?: 'image' | 'video' | 'text';
          content?: string | null;
          image_url?: string | null;
          video_url?: string | null;
          link?: string | null;
          position?: 'top' | 'bottom' | 'sidebar' | 'inline' | 'popup';
          is_active?: boolean;
          start_date?: string | null;
          end_date?: string | null;
          order?: number;
          updated_at?: string;
        };
      };
      activity_logs: {
        Row: {
          id: string;
          user_id: string | null;
          user_name: string | null;
          action: string;
          details: string | null;
          created_at: string;
        };
        Insert: {
          user_id?: string | null;
          user_name?: string | null;
          action: string;
          details?: string | null;
        };
        Update: never;
      };
      store_settings: {
        Row: {
          id: string;
          name: string;
          logo: string | null;
          currency: string;
          social_links: SocialLinks;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name?: string;
          logo?: string | null;
          currency?: string;
          social_links?: SocialLinks;
        };
        Update: {
          name?: string;
          logo?: string | null;
          currency?: string;
          social_links?: SocialLinks;
          updated_at?: string;
        };
      };
    };
    Views: {
      statistics: {
        Row: {
          total_products: number;
          total_orders: number;
          today_orders: number;
          week_orders: number;
          month_orders: number;
          total_customers: number;
          total_revenue: number;
        };
      };
    };
    Functions: {
      log_activity: {
        Args: {
          p_user_id: string;
          p_user_name: string;
          p_action: string;
          p_details: string;
        };
        Returns: string;
      };
    };
  };
}

// Additional types for JSONB fields
export interface ProductImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

export interface ProductSize {
  id: string;
  name: string;
  stock: number;
  priceModifier: number;
}

export interface ProductColor {
  id: string;
  name: string;
  hex: string;
  stock: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  size?: string;
  color?: string;
  quantity: number;
  price: number;
  sourceUrl?: string;
}

export type OrderStatus = 'pending' | 'waiting_payment' | 'paid' | 'approved' | 'completed' | 'cancelled';

export interface SocialLinks {
  whatsapp: string;
  whatsappCategory?: Record<string, string>;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  website?: string;
  email?: string;
}
