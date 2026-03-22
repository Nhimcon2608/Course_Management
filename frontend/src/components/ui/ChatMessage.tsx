import React from 'react';
import { motion } from 'framer-motion';
import { Bot, User, ExternalLink } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '@/hooks/useChat';
import CourseCard from './CourseCard';
import CouponCard from './CouponCard';

interface ChatMessageProps {
  message: ChatMessageType;
  isTyping?: boolean;
  onSuggestedQuestion?: (question: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isTyping = false, onSuggestedQuestion }) => {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Parse course data from message content
  const parseCourseData = (content: string) => {
    try {
      // Look for course data in JSON format - improved regex to capture complete JSON
      const courseDataMatch = content.match(/(?:COURSE_DATA|TOP_COURSES_DATA):\s*(\[[\s\S]*)/);

      console.log('🔍 Parsing course data from content:', {
        hasContent: !!content,
        contentLength: content.length,
        hasCourseData: !!courseDataMatch,
        rawMatch: courseDataMatch?.[0]?.substring(0, 200) + '...'
      });

      if (courseDataMatch) {
        const jsonString = courseDataMatch[1];
        console.log('📝 JSON string to parse:', jsonString.substring(0, 200) + '...');

        // Extract complete JSON array by counting brackets
        const extractCompleteJson = (str: string) => {
          let bracketCount = 0;
          let inString = false;
          let escaped = false;
          let jsonEnd = -1;

          for (let i = 0; i < str.length; i++) {
            const char = str[i];

            if (escaped) {
              escaped = false;
              continue;
            }

            if (char === '\\') {
              escaped = true;
              continue;
            }

            if (char === '"') {
              inString = !inString;
              continue;
            }

            if (!inString) {
              if (char === '[') bracketCount++;
              if (char === ']') {
                bracketCount--;
                if (bracketCount === 0) {
                  jsonEnd = i + 1;
                  break;
                }
              }
            }
          }

          return jsonEnd > 0 ? str.substring(0, jsonEnd) : str;
        };

        const completeJson = extractCompleteJson(jsonString);
        console.log('📝 Complete JSON:', completeJson.substring(0, 300) + '...');

        try {
          const parsed = JSON.parse(completeJson);
          console.log('✅ Parsed course data:', parsed);
          return parsed;
        } catch (jsonError) {
          console.error('❌ JSON parse error:', jsonError);
          console.log('❌ Failed JSON string:', completeJson);
        }
      }
    } catch (error) {
      console.error('❌ Error parsing course data:', error);
    }
    return null;
  };

  // Parse coupon data from message content
  const parseCouponData = (content: string) => {
    try {
      const couponDataMatch = content.match(/COUPON_DATA:\s*(\[[\s\S]*)/);

      console.log('🎫 Parsing coupon data from content:', {
        hasContent: !!content,
        contentLength: content.length,
        hasCouponData: !!couponDataMatch,
        rawMatch: couponDataMatch?.[0]?.substring(0, 200) + '...'
      });

      if (couponDataMatch) {
        // Extract complete JSON array by counting brackets
        const extractCompleteJson = (str: string) => {
          let bracketCount = 0;
          let inString = false;
          let escaped = false;
          let jsonEnd = -1;

          for (let i = 0; i < str.length; i++) {
            const char = str[i];

            if (escaped) {
              escaped = false;
              continue;
            }

            if (char === '\\') {
              escaped = true;
              continue;
            }

            if (char === '"') {
              inString = !inString;
              continue;
            }

            if (!inString) {
              if (char === '[') bracketCount++;
              if (char === ']') {
                bracketCount--;
                if (bracketCount === 0) {
                  jsonEnd = i + 1;
                  break;
                }
              }
            }
          }

          return jsonEnd > 0 ? str.substring(0, jsonEnd) : str;
        };

        const completeJson = extractCompleteJson(couponDataMatch[1]);
        console.log('🎫 Complete coupon JSON:', completeJson.substring(0, 300) + '...');

        try {
          const parsed = JSON.parse(completeJson);
          console.log('✅ Parsed coupon data:', parsed);
          return parsed;
        } catch (jsonError) {
          console.error('❌ Coupon JSON parse error:', jsonError);
          console.log('❌ Failed coupon JSON string:', completeJson);
        }
      }
    } catch (error) {
      console.error('❌ Error parsing coupon data:', error);
    }
    return null;
  };

  const courseData = parseCourseData(message.content);
  const couponData = parseCouponData(message.content);
  console.log('📊 Final courseData:', courseData);
  console.log('🎫 Final couponData:', couponData);

  // Clean content by removing course and coupon data JSON
  const cleanContent = (content: string) => {
    const cleaned = content
      .replace(/(?:COURSE_DATA|TOP_COURSES_DATA|COUPON_DATA):\s*\[[\s\S]*/g, '')
      .trim();

    console.log('🧹 Cleaned content:', {
      original: content.length,
      cleaned: cleaned.length,
      removed: content.length - cleaned.length
    });

    return cleaned;
  };

  // Enhanced content rendering with proper formatting and clickable links
  const renderEnhancedContent = (content: string) => {
    // First, process the content to handle various formatting
    let processedContent = content;

    // Split content by links first to preserve them
    const linkRegex = /(https?:\/\/[^\s\]]+)/g;
    const linkParts = processedContent.split(linkRegex);

    return linkParts.map((part, partIndex) => {
      // Clean the link by removing trailing punctuation and brackets
      const cleanLink = part.replace(/[\]\)\.,:;!?]+$/, '');

      if (linkRegex.test(part)) {
        // Handle links
        try {
          new URL(cleanLink);
          return (
            <a
              key={partIndex}
              href={cleanLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 underline inline-flex items-center gap-1 mx-1 font-medium px-2 py-1 rounded-md transition-colors duration-200"
            >
              {cleanLink.includes('/courses/') ? '🎓 Xem khóa học' :
               cleanLink.includes('/categories/') ? '📚 Xem danh mục' :
               '🔗 Xem chi tiết'}
              <ExternalLink className="h-3 w-3" />
            </a>
          );
        } catch (e) {
          return part;
        }
      } else {
        // Handle text formatting for non-link parts
        return (
          <span key={partIndex}>
            {renderFormattedText(part)}
          </span>
        );
      }
    });
  };

  // Function to render formatted text with proper styling
  const renderFormattedText = (text: string) => {
    // Split by lines to handle line breaks and lists
    const lines = text.split('\n');

    return lines.map((line, lineIndex) => {
      // Handle different line types
      if (line.trim() === '') {
        return <br key={lineIndex} />;
      }

      // Handle bullet points and lists
      if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
        const listContent = line.replace(/^[\s]*[-•]\s*/, '');
        return (
          <div key={lineIndex} className="flex items-start gap-3 my-2 pl-2">
            <span className="text-primary-500 font-bold mt-0.5 text-sm">•</span>
            <span className="flex-1 text-gray-700">{parseInlineFormatting(listContent)}</span>
          </div>
        );
      }

      // Handle numbered lists
      if (/^\d+\.\s/.test(line.trim())) {
        const match = line.match(/^(\s*)(\d+)\.\s(.*)$/);
        if (match) {
          const [, , number, content] = match;
          return (
            <div key={lineIndex} className="flex items-start gap-3 my-2 pl-2">
              <span className="text-primary-600 font-semibold min-w-[1.5rem] text-sm">{number}.</span>
              <span className="flex-1 text-gray-700">{parseInlineFormatting(content)}</span>
            </div>
          );
        }
      }

      // Handle table rows (lines that start with |)
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        const cells = line.split('|').filter(cell => cell.trim() !== '');
        const isHeaderRow = cells.some(cell => cell.includes('---'));

        if (isHeaderRow) {
          return null; // Skip separator rows
        }

        // Check if this is the first table row to determine if it's a header
        const isFirstRow = lineIndex === 0 || !lines[lineIndex - 1]?.trim().startsWith('|');

        return (
          <div key={lineIndex} className={`grid gap-2 py-2 text-sm ${
            cells.length === 4 ? 'grid-cols-4' :
            cells.length === 3 ? 'grid-cols-3' :
            cells.length === 2 ? 'grid-cols-2' : 'grid-cols-1'
          } ${isFirstRow ? 'bg-primary-50 border-b-2 border-primary-200 font-semibold' : 'border-b border-gray-100'}`}>
            {cells.map((cell, cellIndex) => (
              <div key={cellIndex} className={`${
                isFirstRow
                  ? 'font-semibold text-primary-800'
                  : cellIndex === 0
                    ? 'font-medium text-gray-900'
                    : 'text-gray-700'
              } px-2 py-1 ${cellIndex === cells.length - 1 ? 'truncate' : ''}`}>
                {parseInlineFormatting(cell.trim())}
              </div>
            ))}
          </div>
        );
      }

      // Handle section headers (lines that end with :)
      if (line.trim().endsWith(':') && line.trim().length > 1) {
        return (
          <div key={lineIndex} className="font-semibold text-gray-900 mt-4 mb-2 text-sm uppercase tracking-wide">
            {parseInlineFormatting(line.replace(':', ''))}
          </div>
        );
      }

      // Regular paragraph
      return (
        <div key={lineIndex} className="my-1 text-gray-700 leading-relaxed">
          {parseInlineFormatting(line)}
        </div>
      );
    });
  };

  // Function to parse inline formatting (bold, italic, etc.)
  const parseInlineFormatting = (text: string) => {
    // Remove asterisks and replace with proper formatting
    let currentText = text;

    // Handle bold text (**text** or *text*)
    currentText = currentText.replace(/\*\*([^*]+)\*\*/g, '<BOLD>$1</BOLD>');
    currentText = currentText.replace(/\*([^*]+)\*/g, '<BOLD>$1</BOLD>');

    // Handle italic text (_text_)
    currentText = currentText.replace(/_([^_]+)_/g, '<ITALIC>$1</ITALIC>');

    // Split by our custom tags and render
    const segments = currentText.split(/(<BOLD>.*?<\/BOLD>|<ITALIC>.*?<\/ITALIC>)/);

    return segments.map((segment, index) => {
      if (segment.startsWith('<BOLD>')) {
        const content = segment.replace(/<\/?BOLD>/g, '');
        return <strong key={index} className="font-semibold text-gray-900 bg-gray-50 px-1 rounded">{content}</strong>;
      } else if (segment.startsWith('<ITALIC>')) {
        const content = segment.replace(/<\/?ITALIC>/g, '');
        return <em key={index} className="italic text-gray-600">{content}</em>;
      } else {
        return segment;
      }
    });
  };

  // Extract suggested questions from assistant messages
  const extractSuggestions = (content: string): string[] => {
    const suggestions: string[] = [];

    // Look for common question patterns
    if (content.includes('khóa học') && isAssistant) {
      suggestions.push('Tôi muốn xem thêm khóa học tương tự');
    }
    if (content.includes('giá') || content.includes('phí')) {
      suggestions.push('Có chương trình giảm giá nào không?');
    }
    if (content.includes('giảng viên')) {
      suggestions.push('Tôi muốn biết thêm về giảng viên');
    }
    if (content.includes('chứng chỉ')) {
      suggestions.push('Chứng chỉ có được công nhận không?');
    }

    return suggestions.slice(0, 2); // Limit to 2 suggestions
  };

  const suggestions = isAssistant ? extractSuggestions(message.content) : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser 
          ? 'bg-primary-500 text-white' 
          : 'bg-gray-100 text-gray-600'
      }`}>
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Message Bubble */}
        <div className={`px-4 py-3 rounded-2xl shadow-sm ${
          isUser
            ? 'bg-primary-500 text-white rounded-br-md'
            : 'bg-white text-gray-800 rounded-bl-md border border-gray-200'
        }`}>
          {isTyping ? (
            <div className="flex items-center space-x-1">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          ) : (
            <div className={`leading-relaxed ${isUser ? 'text-white' : 'text-gray-800'}`}>
              {isUser ? (
                // For user messages, just display plain text
                <div className="whitespace-pre-wrap">{message.content}</div>
              ) : (
                // For assistant messages, apply enhanced formatting
                <div>
                  {renderEnhancedContent(cleanContent(message.content))}

                  {/* Render course cards if course data exists */}
                  {courseData && courseData.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        📚 Khóa học được đề xuất:
                      </div>
                      <div className="grid gap-3">
                        {courseData.map((course: any, index: number) => (
                          <CourseCard
                            key={course._id || index}
                            course={course}
                            compact={true}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Render coupon cards if coupon data exists */}
                  {couponData && couponData.length > 0 && (
                    <div className="mt-4 space-y-3 bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <div className="text-sm font-medium text-orange-800 mb-3 flex items-center gap-2">
                        🎫 <span>Mã giảm giá hiện tại ({couponData.length} mã):</span>
                      </div>
                      <div className="grid gap-3">
                        {couponData.map((coupon: any, index: number) => (
                          <CouponCard
                            key={coupon._id || index}
                            coupon={coupon}
                            compact={true}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Suggestions */}
        {!isTyping && suggestions.length > 0 && onSuggestedQuestion && (
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => onSuggestedQuestion(suggestion)}
                className="text-xs bg-primary-50 hover:bg-primary-100 text-primary-700 border border-primary-200 hover:border-primary-300 px-3 py-2 rounded-full transition-all duration-200 font-medium"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Timestamp */}
        {!isTyping && (
          <span className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {formatTime(message.timestamp)}
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default ChatMessage;
