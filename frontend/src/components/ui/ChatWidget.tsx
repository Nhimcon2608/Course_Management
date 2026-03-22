'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  X,
  Maximize2,
  Minimize2,
  RotateCcw,
  Bot,
  ZoomIn,
  ZoomOut,
  ArrowUp
} from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import ChatQuickActions from './ChatQuickActions';

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // Trạng thái phóng to
  const [fontSize, setFontSize] = useState(14); // Base font size in px
  const [showScrollTop, setShowScrollTop] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { messages, isLoading, sendMessage, clearChat, isTyping } = useChat();

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setFontSize(prev => Math.min(prev + 2, 20));
  }, []);

  const handleZoomOut = useCallback(() => {
    setFontSize(prev => Math.max(prev - 2, 10));
  }, []);

  const handleScrollToTop = useCallback(() => {
    messagesContainerRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  // Keyboard shortcuts for zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          handleZoomIn();
        } else if (e.key === '-') {
          e.preventDefault();
          handleZoomOut();
        }
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleZoomIn, handleZoomOut]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Handle scroll to show/hide scroll-to-top button
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollTop(!isNearBottom && scrollTop > 200);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const handleToggleChat = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    // Khi mở chat, reset về trạng thái bình thường
    if (newIsOpen) {
      setIsMinimized(false);
      setIsExpanded(false);
    }
    console.log('🔄 Chat toggled:', newIsOpen);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    setIsExpanded(false);
  };

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
    setIsMinimized(false);
  };

  const handleMaximize = () => {
    setIsMinimized(false);
    setIsExpanded(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const handleQuickAction = (message: string) => {
    sendMessage(message);
  };

  return (
    <>
      {/* Chat Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-40"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <button
          onClick={handleToggleChat}
          className="w-14 h-14 bg-primary-500 hover:bg-primary-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="h-6 w-6" />
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MessageCircle className="h-6 w-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Notification Badge */}
        {!isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
          >
            <Bot className="h-3 w-3" />
          </motion.div>
        )}
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: isMinimized ? 0.8 : 1
            }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`fixed bottom-6 right-6 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col transition-all duration-300 ${
              isMinimized
                ? 'h-16 w-80'
                : isExpanded
                  ? 'h-auto max-h-[calc(100vh-120px)] w-[50vw]'
                  : 'h-auto max-h-[500px] w-80'
            }`}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-4 flex items-center justify-between flex-shrink-0 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Trợ lý AI</h3>
                  <p className="text-xs text-primary-100">
                    {isTyping ? 'Đang nhập...' : 'Sẵn sàng hỗ trợ'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={handleZoomOut}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                  title="Thu nhỏ chữ (Ctrl+-)"
                >
                  <ZoomOut className="h-3 w-3" />
                </button>
                <span className="text-xs text-primary-100 px-1 min-w-[2rem] text-center">
                  {fontSize}px
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                  title="Phóng to chữ (Ctrl++)"
                >
                  <ZoomIn className="h-3 w-3" />
                </button>
                <div className="w-px h-4 bg-white/20 mx-1" />
                <button
                  onClick={clearChat}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                  title="Xóa cuộc trò chuyện"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  onClick={handleExpand}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                  title={isExpanded ? "Thu nhỏ về kích thước bình thường" : "Phóng to chat"}
                >
                  {isExpanded ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={handleClose}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                  title="Đóng"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Chat Content */}
            {!isMinimized && (
              <div className="flex flex-col flex-1 min-h-0">
                {/* Quick Actions - Moved to top with animation */}
                <AnimatePresence>
                  {messages.length <= 1 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex-shrink-0"
                    >
                      <ChatQuickActions
                        onSelectAction={handleQuickAction}
                        isLoading={isLoading}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Messages - Flexible height container */}
                <div
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto p-4 bg-gray-50 relative custom-scrollbar min-h-0"
                  style={{
                    fontSize: `${fontSize}px`,
                    maxHeight: isExpanded
                      ? 'calc(100vh - 280px)' // Trừ header website + chat header + input + margins
                      : (messages.length <= 1 ? '16rem' : '20rem')
                  }}
                >
                  {messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      onSuggestedQuestion={sendMessage}
                    />
                  ))}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <ChatMessage
                      message={{
                        id: 'typing',
                        role: 'assistant',
                        content: '',
                        timestamp: new Date()
                      }}
                      isTyping={true}
                    />
                  )}

                  <div ref={messagesEndRef} />

                  {/* Scroll to Top Button */}
                  <AnimatePresence>
                    {showScrollTop && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={handleScrollToTop}
                        className="absolute bottom-4 right-4 w-8 h-8 bg-primary-500 hover:bg-primary-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors z-10"
                        title="Cuộn lên đầu"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>

                {/* Input - Always at bottom, never hidden */}
                <div className="flex-shrink-0">
                  <ChatInput
                    onSendMessage={sendMessage}
                    isLoading={isLoading}
                    placeholder="Nhập câu hỏi của bạn..."
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatWidget;
