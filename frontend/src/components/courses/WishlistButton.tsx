'use client';

import React from 'react';
import { Heart, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/store/authStore';
import { useWishlistActions, useWishlistLoading } from '@/store/wishlistStore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface WishlistButtonProps {
  courseId: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  isInWishlist?: boolean;
}

const WishlistButton: React.FC<WishlistButtonProps> = ({
  courseId,
  className,
  variant = 'outline',
  size = 'md',
  showText = true,
  isInWishlist = false
}) => {
  const { isAuthenticated, user } = useAuth();
  const { addToWishlist, removeFromWishlist, isInWishlist: checkIsInWishlist } = useWishlistActions();
  const isLoading = useWishlistLoading();
  const router = useRouter();

  // Check if course is in wishlist
  const inWishlist = isInWishlist || checkIsInWishlist(courseId);

  const handleWishlistToggle = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to manage your wishlist', {
        icon: '🔒',
        duration: 4000
      });
      router.push('/auth/login?redirect=/courses');
      return;
    }

    // Check email verification for adding to wishlist
    if (!inWishlist && !user?.isEmailVerified) {
      toast.error('Please verify your email address to use wishlist features', {
        icon: '📧',
        duration: 6000,
        style: {
          background: '#FEF3C7',
          color: '#92400E',
          border: '1px solid #F59E0B'
        }
      });
      router.push('/auth/verify-email');
      return;
    }

    try {
      if (inWishlist) {
        await removeFromWishlist(courseId);
      } else {
        await addToWishlist(courseId);
      }
    } catch (error) {
      // Error handling is done in the store
      console.error('Error in WishlistButton:', error);
    }
  };

  return (
    <Button
      onClick={handleWishlistToggle}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={cn(
        'transition-colors',
        inWishlist && 'text-red-600 border-red-600 hover:bg-red-50',
        className
      )}
      isLoading={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {showText && <span className="ml-2">Loading...</span>}
        </>
      ) : (
        <>
          <Heart 
            className={cn(
              'h-4 w-4',
              inWishlist ? 'fill-current text-red-600' : 'text-current',
              showText && 'mr-2'
            )} 
          />
          {showText && (
            <span>{inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}</span>
          )}
        </>
      )}
    </Button>
  );
};

export default WishlistButton;
