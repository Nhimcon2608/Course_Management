import api from '@/lib/api';
import { Cart, CartSummary, ApiResponse } from '@/types';

export const cartApi = {
  // Get user's cart
  getCart: async (): Promise<{ cart: Cart; summary: CartSummary }> => {
    const response = await api.get<ApiResponse<{ cart: Cart; summary: CartSummary }>>('/cart');
    return response.data.data!;
  },

  // Add course to cart
  addToCart: async (courseId: string): Promise<{ cart: Cart; summary: CartSummary }> => {
    const response = await api.post<ApiResponse<{ cart: Cart; summary: CartSummary }>>('/cart/add', {
      courseId
    });
    return response.data.data!;
  },

  // Remove course from cart
  removeFromCart: async (courseId: string): Promise<{ cart: Cart; summary: CartSummary }> => {
    const response = await api.delete<ApiResponse<{ cart: Cart; summary: CartSummary }>>('/cart/remove', {
      data: { courseId }
    });
    return response.data.data!;
  },

  // Clear entire cart
  clearCart: async (): Promise<{ cart: Cart; summary: CartSummary }> => {
    const response = await api.delete<ApiResponse<{ cart: Cart; summary: CartSummary }>>('/cart/clear');
    return response.data.data!;
  },

  // Apply coupon to cart
  applyCoupon: async (couponCode: string): Promise<{ cart: Cart; summary: CartSummary }> => {
    const response = await api.post<ApiResponse<{ cart: Cart; summary: CartSummary }>>('/cart/apply-coupon', {
      couponCode
    });
    return response.data.data!;
  },

  // Remove coupon from cart
  removeCoupon: async (): Promise<{ cart: Cart; summary: CartSummary }> => {
    const response = await api.delete<ApiResponse<{ cart: Cart; summary: CartSummary }>>('/cart/remove-coupon');
    return response.data.data!;
  }
};
