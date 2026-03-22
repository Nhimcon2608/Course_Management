import React from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  CreditCard, 
  HelpCircle, 
  Phone, 
  Award,
  Users
} from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  message: string;
  icon: React.ReactNode;
  color: string;
}

interface ChatQuickActionsProps {
  onSelectAction: (message: string) => void;
  isLoading: boolean;
}

const quickActions: QuickAction[] = [
  {
    id: 'courses',
    label: 'Khóa học',
    message: 'Tôi muốn tìm hiểu về các khóa học có sẵn',
    icon: <BookOpen className="h-4 w-4" />,
    color: 'bg-blue-500'
  },
  {
    id: 'enrollment',
    label: 'Đăng ký',
    message: 'Làm thế nào để đăng ký khóa học?',
    icon: <Users className="h-4 w-4" />,
    color: 'bg-green-500'
  },
  {
    id: 'payment',
    label: 'Thanh toán',
    message: 'Các phương thức thanh toán nào được hỗ trợ?',
    icon: <CreditCard className="h-4 w-4" />,
    color: 'bg-purple-500'
  },
  {
    id: 'certificate',
    label: 'Chứng chỉ',
    message: 'Tôi có nhận được chứng chỉ sau khi hoàn thành khóa học không?',
    icon: <Award className="h-4 w-4" />,
    color: 'bg-yellow-500'
  },
  {
    id: 'support',
    label: 'Hỗ trợ',
    message: 'Tôi cần hỗ trợ kỹ thuật',
    icon: <HelpCircle className="h-4 w-4" />,
    color: 'bg-red-500'
  },
  {
    id: 'contact',
    label: 'Liên hệ',
    message: 'Làm thế nào để liên hệ với đội ngũ hỗ trợ?',
    icon: <Phone className="h-4 w-4" />,
    color: 'bg-indigo-500'
  }
];

const ChatQuickActions: React.FC<ChatQuickActionsProps> = ({ onSelectAction, isLoading }) => {
  return (
    <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-medium text-gray-600">Câu hỏi thường gặp:</h4>
        <span className="text-xs text-gray-500">Chọn hoặc nhập câu hỏi</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {quickActions.map((action, index) => (
          <motion.button
            key={action.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            onClick={() => onSelectAction(action.message)}
            disabled={isLoading}
            className="flex items-center gap-2 p-2 text-left text-xs bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <div className={`w-5 h-5 ${action.color} text-white rounded-full flex items-center justify-center flex-shrink-0`}>
              {React.cloneElement(action.icon as React.ReactElement, { className: 'h-3 w-3' })}
            </div>
            <span className="text-gray-700 truncate leading-tight">{action.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default ChatQuickActions;
