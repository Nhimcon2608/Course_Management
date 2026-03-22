import api from '@/lib/api';
import { Cart, CartSummary, ApiResponse } from '@/types';

export const cartApi = {
  // Get user's cart
  getCart: async (): Promise<{ cart: Cart; summary: CartSummary }> => {
    const response = await api.get('/cart');
    return (response.data as ApiResponse<{ cart: Cart; summary: CartSummary }>).data!;
  },

  // Add course to cart
  addToCart: async (courseId: string): Promise<{ cart: Cart; summary: CartSummary }> => {
    const response = await api.post('/cart/add', {
      courseId
    });
    return (response.data as ApiResponse<{ cart: Cart; summary: CartSummary }>).data!;
  },

  // Remove course from cart
  removeFromCart: async (courseId: string): Promise<{ cart: Cart; summary: CartSummary }> => {
    const response = await api.delete('/cart/remove', {
      data: { courseId }
    });
    return (response.data as ApiResponse<{ cart: Cart; summary: CartSummary }>).data!;
  },

  // Clear entire cart
  clearCart: async (): Promise<{ cart: Cart; summary: CartSummary }> => {
    const response = await api.delete('/cart/clear');
    return (response.data as ApiResponse<{ cart: Cart; summary: CartSummary }>).data!;
  },

  // Apply coupon to cart
  applyCoupon: async (couponCode: string): Promise<{ cart: Cart; summary: CartSummary }> => {
    const response = await api.post('/cart/apply-coupon', {
      couponCode
    });
    return (response.data as ApiResponse<{ cart: Cart; summary: CartSummary }>).data!;
  },

  // Remove coupon from cart
  removeCoupon: async (): Promise<{ cart: Cart; summary: CartSummary }> => {
    const response = await api.delete('/cart/remove-coupon');
    return (response.data as ApiResponse<{ cart: Cart; summary: CartSummary }>).data!;
  }
};
