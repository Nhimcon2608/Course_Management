'use client';

import React from 'react';
import { ShoppingCart, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/store/authStore';
import { useCartActions, useCartLoading } from '@/store/cartStore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface CartButtonProps {
  courseId: string;
  price: number;
  originalPrice?: number;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  children?: React.ReactNode;
}

const CartButton: React.FC<CartButtonProps> = ({
  courseId,
  price,
  originalPrice,
  className,
  variant = 'primary',
  size = 'md',
  showIcon = true,
  children
}) => {
  const { isAuthenticated, user } = useAuth();
  const { addToCart } = useCartActions();
  const isLoading = useCartLoading();
  const router = useRouter();

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add courses to cart', {
        icon: '🔒',
        duration: 4000
      });
      router.push('/auth/login?redirect=/courses');
      return;
    }

    // Check email verification
    if (!user?.isEmailVerified) {
      toast.error('Please verify your email address to purchase courses', {
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
      await addToCart(courseId);
    } catch (error) {
      // Error handling is done in the store
      console.error('Error in CartButton:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  return (
    <Button
      onClick={handleAddToCart}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={className}
      isLoading={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Adding...
        </>
      ) : (
        <>
          {showIcon && <ShoppingCart className="h-4 w-4 mr-2" />}
          {children || (
            <div className="flex flex-col items-center">
              <span>Add to Cart</span>
              <div className="flex items-center space-x-2 text-sm">
                <span className="font-bold">{formatPrice(price)}</span>
                {originalPrice && originalPrice > price && (
                  <span className="line-through text-gray-500">
                    {formatPrice(originalPrice)}
                  </span>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </Button>
  );
};

export default CartButton;
