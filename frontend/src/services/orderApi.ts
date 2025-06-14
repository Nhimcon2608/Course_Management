import api from './api';
import { ApiResponse, Order, CreateOrderRequest, ZaloPayPaymentResponse, PaymentStatusResponse } from '@/types';

export const orderApi = {
  // Get user orders
  getOrders: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{ orders: Order[]; pagination: any }> => {
    const response = await api.get<ApiResponse<{ orders: Order[]; pagination: any }>>('/orders', {
      params
    });
    return response.data.data!;
  },

  // Get order by ID
  getOrder: async (orderId: string): Promise<Order> => {
    const response = await api.get<ApiResponse<{ order: Order }>>(`/orders/${orderId}`);
    return response.data.data!.order;
  },

  // Create order from cart
  createOrder: async (orderData: CreateOrderRequest): Promise<Order> => {
    const response = await api.post<ApiResponse<{ order: Order }>>('/orders', orderData);
    return response.data.data!.order;
  },

  // Create ZaloPay payment
  createZaloPayPayment: async (orderId: string): Promise<ZaloPayPaymentResponse> => {
    const response = await api.post<ApiResponse<ZaloPayPaymentResponse>>(
      `/orders/${orderId}/payment/zalopay`
    );
    return response.data.data!;
  },

  // Check payment status
  checkPaymentStatus: async (orderId: string): Promise<PaymentStatusResponse> => {
    const response = await api.get<ApiResponse<PaymentStatusResponse>>(
      `/orders/${orderId}/payment/status`
    );
    return response.data.data!;
  },

  // Cancel order
  cancelOrder: async (orderId: string, reason?: string): Promise<Order> => {
    const response = await api.post<ApiResponse<{ order: Order }>>(
      `/orders/${orderId}/cancel`,
      { reason }
    );
    return response.data.data!.order;
  },

  // Request refund
  requestRefund: async (orderId: string, reason?: string): Promise<Order> => {
    const response = await api.post<ApiResponse<{ order: Order }>>(
      `/orders/${orderId}/refund`,
      { reason }
    );
    return response.data.data!.order;
  }
};

export default orderApi;
