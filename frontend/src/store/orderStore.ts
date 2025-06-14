import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Order, CreateOrderRequest, ZaloPayPaymentResponse, PaymentStatusResponse } from '@/types';
import orderApi from '@/services/orderApi';
import toast from 'react-hot-toast';

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchOrders: (params?: { page?: number; limit?: number; status?: string }) => Promise<void>;
  fetchOrder: (orderId: string) => Promise<void>;
  createOrder: (orderData: CreateOrderRequest) => Promise<Order>;
  createZaloPayPayment: (orderId: string) => Promise<ZaloPayPaymentResponse>;
  checkPaymentStatus: (orderId: string) => Promise<PaymentStatusResponse>;
  cancelOrder: (orderId: string, reason?: string) => Promise<void>;
  requestRefund: (orderId: string, reason?: string) => Promise<void>;
  clearError: () => void;
  clearCurrentOrder: () => void;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      currentOrder: null,
      isLoading: false,
      error: null,

      fetchOrders: async (params) => {
        try {
          set({ isLoading: true, error: null });
          const data = await orderApi.getOrders(params);
          set({ orders: data.orders });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to fetch orders';
          set({ error: errorMessage });
          toast.error(errorMessage, {
            icon: '❌',
            duration: 4000
          });
          console.error('Error fetching orders:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      fetchOrder: async (orderId: string) => {
        try {
          set({ isLoading: true, error: null });
          const order = await orderApi.getOrder(orderId);
          set({ currentOrder: order });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to fetch order';
          set({ error: errorMessage });
          toast.error(errorMessage, {
            icon: '❌',
            duration: 4000
          });
          console.error('Error fetching order:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      createOrder: async (orderData: CreateOrderRequest) => {
        try {
          set({ isLoading: true, error: null });
          const order = await orderApi.createOrder(orderData);
          
          // Add to orders list
          const { orders } = get();
          set({ 
            orders: [order, ...orders],
            currentOrder: order 
          });

          toast.success('Order created successfully!', {
            icon: '🛍️',
            duration: 3000
          });

          return order;
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to create order';
          set({ error: errorMessage });
          toast.error(errorMessage, {
            icon: '❌',
            duration: 4000
          });
          console.error('Error creating order:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      createZaloPayPayment: async (orderId: string) => {
        try {
          set({ isLoading: true, error: null });
          const paymentData = await orderApi.createZaloPayPayment(orderId);
          
          toast.success('Payment link created successfully!', {
            icon: '💳',
            duration: 3000
          });

          return paymentData;
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to create payment';
          set({ error: errorMessage });
          toast.error(errorMessage, {
            icon: '❌',
            duration: 4000
          });
          console.error('Error creating ZaloPay payment:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      checkPaymentStatus: async (orderId: string) => {
        try {
          set({ isLoading: true, error: null });
          const statusData = await orderApi.checkPaymentStatus(orderId);
          
          // Update current order if it matches
          const { currentOrder } = get();
          if (currentOrder && currentOrder._id === orderId) {
            set({
              currentOrder: {
                ...currentOrder,
                paymentStatus: statusData.paymentStatus,
                status: statusData.orderStatus,
                completedAt: statusData.completedAt
              }
            });
          }

          // Update in orders list
          const { orders } = get();
          const updatedOrders = orders.map(order => 
            order._id === orderId 
              ? {
                  ...order,
                  paymentStatus: statusData.paymentStatus,
                  status: statusData.orderStatus,
                  completedAt: statusData.completedAt
                }
              : order
          );
          set({ orders: updatedOrders });

          return statusData;
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to check payment status';
          set({ error: errorMessage });
          console.error('Error checking payment status:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      cancelOrder: async (orderId: string, reason?: string) => {
        try {
          set({ isLoading: true, error: null });
          const cancelledOrder = await orderApi.cancelOrder(orderId, reason);
          
          // Update current order if it matches
          const { currentOrder } = get();
          if (currentOrder && currentOrder._id === orderId) {
            set({ currentOrder: cancelledOrder });
          }

          // Update in orders list
          const { orders } = get();
          const updatedOrders = orders.map(order => 
            order._id === orderId ? cancelledOrder : order
          );
          set({ orders: updatedOrders });

          toast.success('Order cancelled successfully!', {
            icon: '🚫',
            duration: 3000
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to cancel order';
          set({ error: errorMessage });
          toast.error(errorMessage, {
            icon: '❌',
            duration: 4000
          });
          console.error('Error cancelling order:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      requestRefund: async (orderId: string, reason?: string) => {
        try {
          set({ isLoading: true, error: null });
          const refundedOrder = await orderApi.requestRefund(orderId, reason);
          
          // Update current order if it matches
          const { currentOrder } = get();
          if (currentOrder && currentOrder._id === orderId) {
            set({ currentOrder: refundedOrder });
          }

          // Update in orders list
          const { orders } = get();
          const updatedOrders = orders.map(order => 
            order._id === orderId ? refundedOrder : order
          );
          set({ orders: updatedOrders });

          toast.success('Refund requested successfully!', {
            icon: '💰',
            duration: 3000
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to request refund';
          set({ error: errorMessage });
          toast.error(errorMessage, {
            icon: '❌',
            duration: 4000
          });
          console.error('Error requesting refund:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      clearError: () => set({ error: null }),
      
      clearCurrentOrder: () => set({ currentOrder: null })
    }),
    {
      name: 'order-store',
      partialize: (state) => ({
        orders: state.orders,
        currentOrder: state.currentOrder
      })
    }
  )
);

export default useOrderStore;
