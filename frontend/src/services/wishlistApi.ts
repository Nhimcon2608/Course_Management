import api from '@/lib/api';
import { Course, WishlistResponse, ApiResponse } from '@/types';

export const wishlistApi = {
  // Get user's wishlist
  getWishlist: async (): Promise<WishlistResponse> => {
    const response = await api.get<ApiResponse<WishlistResponse>>('/wishlist');
    return response.data.data!;
  },

  // Add course to wishlist
  addToWishlist: async (courseId: string): Promise<WishlistResponse> => {
    const response = await api.post<ApiResponse<WishlistResponse>>('/wishlist/add', {
      courseId
    });
    return response.data.data!;
  },

  // Remove course from wishlist
  removeFromWishlist: async (courseId: string): Promise<WishlistResponse> => {
    const response = await api.delete<ApiResponse<WishlistResponse>>('/wishlist/remove', {
      data: { courseId }
    });
    return response.data.data!;
  },

  // Move course from wishlist to cart
  moveToCart: async (courseId: string): Promise<WishlistResponse> => {
    const response = await api.post<ApiResponse<WishlistResponse>>('/wishlist/move-to-cart', {
      courseId
    });
    return response.data.data!;
  }
};
