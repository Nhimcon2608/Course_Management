import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Cart, CartSummary } from '@/types';
import { cartApi } from '@/services/cartApi';
import toast from 'react-hot-toast';
import { handleEmailVerificationError } from '@/utils/emailVerificationUtils';

interface CartState {
  cart: Cart | null;
  summary: CartSummary | null;
  isLoading: boolean;
  error: string | null;
}

interface CartActions {
  fetchCart: () => Promise<void>;
  addToCart: (courseId: string) => Promise<void>;
  removeFromCart: (courseId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (couponCode: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

type CartStore = CartState & CartActions;

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // State
      cart: null,
      summary: null,
      isLoading: false,
      error: null,

      // Actions
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),

      fetchCart: async () => {
        try {
          set({ isLoading: true, error: null });
          const data = await cartApi.getCart();
          set({ cart: data.cart, summary: data.summary });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to fetch cart';
          set({ error: errorMessage });
          console.error('Error fetching cart:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      addToCart: async (courseId: string) => {
        try {
          set({ isLoading: true, error: null });
          const data = await cartApi.addToCart(courseId);
          set({ cart: data.cart, summary: data.summary });
          toast.success('Course added to cart successfully!', {
            icon: '🛒',
            duration: 3000
          });
        } catch (error: any) {
          // Check if it's an email verification error
          if (error.response?.status === 403 && error.response?.data?.code === 'EMAIL_VERIFICATION_REQUIRED') {
            // Don't show toast here, let the component handle it
            set({ error: error.response.data.message });
            throw error;
          }

          const errorMessage = error.response?.data?.message || 'Failed to add course to cart';
          set({ error: errorMessage });
          toast.error(errorMessage, {
            icon: '❌',
            duration: 4000
          });
          console.error('Error adding to cart:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      removeFromCart: async (courseId: string) => {
        try {
          set({ isLoading: true, error: null });
          const data = await cartApi.removeFromCart(courseId);
          set({ cart: data.cart, summary: data.summary });
          toast.success('Course removed from cart', {
            icon: '🗑️',
            duration: 3000
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to remove course from cart';
          set({ error: errorMessage });
          toast.error(errorMessage, {
            icon: '❌',
            duration: 4000
          });
          console.error('Error removing from cart:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      clearCart: async () => {
        try {
          set({ isLoading: true, error: null });
          const data = await cartApi.clearCart();
          set({ cart: data.cart, summary: data.summary });
          toast.success('Cart cleared successfully', {
            icon: '🧹',
            duration: 3000
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to clear cart';
          set({ error: errorMessage });
          toast.error(errorMessage, {
            icon: '❌',
            duration: 4000
          });
          console.error('Error clearing cart:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      applyCoupon: async (couponCode: string) => {
        try {
          set({ isLoading: true, error: null });

          // Debug logging
          console.log('Applying coupon:', couponCode);

          const data = await cartApi.applyCoupon(couponCode);
          set({ cart: data.cart, summary: data.summary });
          toast.success(`Coupon "${couponCode}" applied successfully!`, {
            icon: '🎟️',
            duration: 3000
          });
        } catch (error: any) {
          console.error('Error applying coupon:', error);

          let errorMessage = 'Failed to apply coupon';

          if (error.response?.status === 400) {
            errorMessage = error.response.data?.message || 'Invalid coupon or cart requirements not met';
          } else if (error.response?.status === 401) {
            errorMessage = 'Please login to apply coupon';
          } else if (error.response?.status === 404) {
            errorMessage = 'Coupon not found or expired';
          } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          }

          set({ error: errorMessage });
          toast.error(errorMessage, {
            icon: '❌',
            duration: 4000
          });
        } finally {
          set({ isLoading: false });
        }
      },

      removeCoupon: async () => {
        try {
          set({ isLoading: true, error: null });
          const data = await cartApi.removeCoupon();
          set({ cart: data.cart, summary: data.summary });
          toast.success('Coupon removed successfully', {
            icon: '🗑️',
            duration: 3000
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to remove coupon';
          set({ error: errorMessage });
          toast.error(errorMessage, {
            icon: '❌',
            duration: 4000
          });
          console.error('Error removing coupon:', error);
        } finally {
          set({ isLoading: false });
        }
      }
    }),
    {
      name: 'cart-store',
      partialize: (state) => ({
        cart: state.cart,
        summary: state.summary
      })
    }
  )
);

// Selectors
export const useCart = () => useCartStore((state) => state.cart);
export const useCartSummary = () => useCartStore((state) => state.summary);
export const useCartLoading = () => useCartStore((state) => state.isLoading);
export const useCartError = () => useCartStore((state) => state.error);

// Actions
export const useCartActions = () => useCartStore((state) => ({
  fetchCart: state.fetchCart,
  addToCart: state.addToCart,
  removeFromCart: state.removeFromCart,
  clearCart: state.clearCart,
  applyCoupon: state.applyCoupon,
  removeCoupon: state.removeCoupon,
  setLoading: state.setLoading,
  setError: state.setError,
  clearError: state.clearError
}));
