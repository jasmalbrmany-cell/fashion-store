import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Order } from '@/types';
import { withTimeout, getFromCache, setToCache, clearCache, transformOrder } from './helpers';

export const ordersService = {
  async getAll(): Promise<Order[]> {
    const cached = getFromCache('orders_all');
    if (cached) return cached;

    if (!isSupabaseConfigured()) {
      return [];
    }

    const { data, error } = await withTimeout((supabase as any)
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500));

    if (error) {
      console.error('Error fetching orders:', error);
      return [];
    }

    const transformed = (data || []).map(transformOrder);
    setToCache('orders_all', transformed);
    return transformed;
  },

  async getById(id: string): Promise<Order | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    const { data, error } = await (supabase as any)
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching order:', error);
      return null;
    }

    return transformOrder(data);
  },

  async getByNumber(orderNumber: string): Promise<Order | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    const { data, error } = await (supabase as any)
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber)
      .single();

    if (error) {
      console.error('Error fetching order by number:', error);
      return null;
    }

    return transformOrder(data);
  },

  async getByStatus(status: string): Promise<Order[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    const { data, error } = await (supabase as any)
      .from('orders')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders by status:', error);
      return [];
    }

    return (data || []).map(transformOrder);
  },

  async getByCustomer(customerId: string): Promise<Order[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    const { data, error } = await (supabase as any)
      .from('orders')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customer orders:', error);
      return [];
    }

    return (data || []).map(transformOrder);
  },

  async create(order: Partial<Order>): Promise<Order | null> {
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    if (!isSupabaseConfigured()) {
      return null;
    }

    const { data, error } = await (supabase as any)
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_name: order.customerName || '',
        customer_phone: order.customerPhone || '',
        customer_id: order.customerId,
        city: order.city || '',
        address: order.address,
        items: order.items || [],
        subtotal: order.subtotal || 0,
        shipping_cost: order.shippingCost || 0,
        total: order.total || 0,
        notes: order.notes,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating order:', error);
      return null;
    }

    return transformOrder(data);
  },

  async updateStatus(id: string, status: string): Promise<Order | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    const fetchPromise = (supabase as any)
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    try {
      const { data, error } = await withTimeout(fetchPromise);
      if (error) {
        console.error('Error updating order status:', error);
        return null;
      }
      clearCache('orders_all');
      clearCache('statistics_main');
      return transformOrder(data);
    } catch (e) {
      return null;
    }
  },

  async update(id: string, updates: Partial<Order>): Promise<Order | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    const { data, error } = await (supabase as any)
      .from('orders')
      .update({
        customer_name: updates.customerName,
        customer_phone: updates.customerPhone,
        city: updates.city,
        address: updates.address,
        items: updates.items,
        subtotal: updates.subtotal,
        shipping_cost: updates.shippingCost,
        total: updates.total,
        status: updates.status,
        notes: updates.notes,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating order:', error);
      return null;
    }

    return transformOrder(data);
  },
};
