import React from 'react';
import { motion } from 'framer-motion';
import { Tag, Clock, Users, Percent, DollarSign } from 'lucide-react';

interface CouponData {
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  validTo: string;
  remainingUsage: number;
}

interface CouponCardProps {
  coupon: CouponData;
  compact?: boolean;
}

const CouponCard: React.FC<CouponCardProps> = ({ coupon, compact = false }) => {
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN') + 'đ';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getDiscountDisplay = () => {
    if (coupon.discountType === 'percentage') {
      return `${coupon.discountValue}%`;
    } else {
      return formatCurrency(coupon.discountValue);
    }
  };

  const getDiscountIcon = () => {
    return coupon.discountType === 'percentage' ? (
      <Percent className="h-4 w-4" />
    ) : (
      <DollarSign className="h-4 w-4" />
    );
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(coupon.code);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy coupon code:', err);
    }
  };

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-3 hover:shadow-md transition-all duration-200"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full">
              <Tag className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={copyToClipboard}
                  className="font-bold text-orange-800 hover:text-orange-900 cursor-pointer text-sm"
                  title="Click to copy"
                >
                  {coupon.code}
                </button>
                <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded-full">
                  {coupon.discountType === 'percentage' ? 'Phần trăm' : 'Cố định'}
                </span>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Giảm {getDiscountDisplay()} • Tối thiểu {formatCurrency(coupon.minOrderAmount)}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center text-orange-600 font-semibold text-sm">
              {getDiscountIcon()}
              <span className="ml-1">{getDiscountDisplay()}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Còn {coupon.remainingUsage} lượt
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 border border-orange-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-orange-300"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full">
            <Tag className="h-6 w-6 text-white" />
          </div>
          <div>
            <button
              onClick={copyToClipboard}
              className="font-bold text-xl text-orange-800 hover:text-orange-900 cursor-pointer"
              title="Click to copy"
            >
              {coupon.code}
            </button>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-sm bg-orange-200 text-orange-800 px-3 py-1 rounded-full">
                {coupon.discountType === 'percentage' ? 'Giảm phần trăm' : 'Giảm cố định'}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center text-orange-600 font-bold text-2xl">
            {getDiscountIcon()}
            <span className="ml-2">{getDiscountDisplay()}</span>
          </div>
          {coupon.discountType === 'percentage' && coupon.maxDiscount && (
            <div className="text-sm text-gray-600 mt-1">
              Tối đa {formatCurrency(coupon.maxDiscount)}
            </div>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div className="flex items-center space-x-2 text-gray-700">
          <DollarSign className="h-4 w-4 text-green-600" />
          <div>
            <div className="text-xs text-gray-500">Đơn hàng tối thiểu</div>
            <div className="font-semibold">{formatCurrency(coupon.minOrderAmount)}</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 text-gray-700">
          <Clock className="h-4 w-4 text-blue-600" />
          <div>
            <div className="text-xs text-gray-500">Hết hạn</div>
            <div className="font-semibold">{formatDate(coupon.validTo)}</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 text-gray-700">
          <Users className="h-4 w-4 text-purple-600" />
          <div>
            <div className="text-xs text-gray-500">Còn lại</div>
            <div className="font-semibold">{coupon.remainingUsage} lượt</div>
          </div>
        </div>
      </div>

      {/* Action */}
      <div className="mt-6">
        <button
          onClick={copyToClipboard}
          className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
        >
          Sao chép mã giảm giá
        </button>
      </div>
    </motion.div>
  );
};

export default CouponCard;
