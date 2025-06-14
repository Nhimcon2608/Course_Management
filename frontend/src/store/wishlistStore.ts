import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Course } from '@/types';
import { wishlistApi } from '@/services/wishlistApi';
import toast from 'react-hot-toast';

interface WishlistState {
  wishlist: Course[];
  count: number;
  isLoading: boolean;
  error: string | null;
}

interface WishlistActions {
  fetchWishlist: () => Promise<void>;
  addToWishlist: (courseId: string) => Promise<void>;
  removeFromWishlist: (courseId: string) => Promise<void>;
  moveToCart: (courseId: string) => Promise<void>;
  isInWishlist: (courseId: string) => boolean;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

type WishlistStore = WishlistState & WishlistActions;

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      // State
      wishlist: [],
      count: 0,
      isLoading: false,
      error: null,

      // Actions
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),

      isInWishlist: (courseId: string) => {
        const { wishlist } = get();
        return wishlist.some(course => course._id === courseId);
      },

      fetchWishlist: async () => {
        try {
          set({ isLoading: true, error: null });
          const data = await wishlistApi.getWishlist();
          set({ wishlist: data.wishlist, count: data.count });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to fetch wishlist';
          set({ error: errorMessage });
          console.error('Error fetching wishlist:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      addToWishlist: async (courseId: string) => {
        try {
          set({ isLoading: true, error: null });
          const data = await wishlistApi.addToWishlist(courseId);
          set({ wishlist: data.wishlist, count: data.count });
          toast.success('Course added to wishlist!', {
            icon: '❤️',
            duration: 3000
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to add course to wishlist';
          set({ error: errorMessage });
          toast.error(errorMessage, {
            icon: '❌',
            duration: 4000
          });
          console.error('Error adding to wishlist:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      removeFromWishlist: async (courseId: string) => {
        try {
          set({ isLoading: true, error: null });
          const data = await wishlistApi.removeFromWishlist(courseId);
          set({ wishlist: data.wishlist, count: data.count });
          toast.success('Course removed from wishlist', {
            icon: '💔',
            duration: 3000
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to remove course from wishlist';
          set({ error: errorMessage });
          toast.error(errorMessage, {
            icon: '❌',
            duration: 4000
          });
          console.error('Error removing from wishlist:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      moveToCart: async (courseId: string) => {
        try {
          set({ isLoading: true, error: null });
          const data = await wishlistApi.moveToCart(courseId);
          set({ wishlist: data.wishlist, count: data.count });
          toast.success('Course moved to cart!', {
            icon: '🛒',
            duration: 3000
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to move course to cart';
          set({ error: errorMessage });
          toast.error(errorMessage, {
            icon: '❌',
            duration: 4000
          });
          console.error('Error moving to cart:', error);
        } finally {
          set({ isLoading: false });
        }
      }
    }),
    {
      name: 'wishlist-store',
      partialize: (state) => ({
        wishlist: state.wishlist,
        count: state.count
      })
    }
  )
);

// Selectors
export const useWishlist = () => useWishlistStore((state) => state.wishlist);
export const useWishlistCount = () => useWishlistStore((state) => state.count);
export const useWishlistLoading = () => useWishlistStore((state) => state.isLoading);
export const useWishlistError = () => useWishlistStore((state) => state.error);

// Actions
export const useWishlistActions = () => useWishlistStore((state) => ({
  fetchWishlist: state.fetchWishlist,
  addToWishlist: state.addToWishlist,
  removeFromWishlist: state.removeFromWishlist,
  moveToCart: state.moveToCart,
  isInWishlist: state.isInWishlist,
  setLoading: state.setLoading,
  setError: state.setError,
  clearError: state.clearError
}));
