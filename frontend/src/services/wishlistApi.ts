import api from '@/lib/api';
import { WishlistResponse, ApiResponse } from '@/types';

export const wishlistApi = {
  // Get user's wishlist
  getWishlist: async (): Promise<WishlistResponse> => {
    const response = await api.get('/wishlist');
    return (response.data as ApiResponse<WishlistResponse>).data!;
  },

  // Add course to wishlist
  addToWishlist: async (courseId: string): Promise<WishlistResponse> => {
    const response = await api.post('/wishlist/add', {
      courseId
    });
    return (response.data as ApiResponse<WishlistResponse>).data!;
  },

  // Remove course from wishlist
  removeFromWishlist: async (courseId: string): Promise<WishlistResponse> => {
    const response = await api.delete('/wishlist/remove', {
      data: { courseId }
    });
    return (response.data as ApiResponse<WishlistResponse>).data!;
  },

  // Move course from wishlist to cart
  moveToCart: async (courseId: string): Promise<WishlistResponse> => {
    const response = await api.post('/wishlist/move-to-cart', {
      courseId
    });
    return (response.data as ApiResponse<WishlistResponse>).data!;
  }
};
