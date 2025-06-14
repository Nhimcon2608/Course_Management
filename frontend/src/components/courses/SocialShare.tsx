'use client';

import React, { useState } from 'react';
import { Share2, Facebook, Twitter, Linkedin, MessageCircle, Copy, Check } from 'lucide-react';
import Button from '@/components/ui/Button';
import { SocialShareOptions } from '@/types';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
  image?: string;
  className?: string;
  variant?: 'dropdown' | 'inline';
  size?: 'sm' | 'md' | 'lg';
}

const SocialShare: React.FC<SocialShareProps> = ({
  url,
  title,
  description,
  image,
  className,
  variant = 'dropdown',
  size = 'md'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareOptions: SocialShareOptions = {
    url,
    title,
    description,
    image
  };

  const socialPlatforms = [
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'text-blue-600 hover:bg-blue-50',
      shareUrl: (options: SocialShareOptions) => 
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(options.url)}&quote=${encodeURIComponent(options.title)}`
    },
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'text-blue-400 hover:bg-blue-50',
      shareUrl: (options: SocialShareOptions) => 
        `https://twitter.com/intent/tweet?url=${encodeURIComponent(options.url)}&text=${encodeURIComponent(options.title)}`
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'text-blue-700 hover:bg-blue-50',
      shareUrl: (options: SocialShareOptions) => 
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(options.url)}`
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'text-green-600 hover:bg-green-50',
      shareUrl: (options: SocialShareOptions) => 
        `https://wa.me/?text=${encodeURIComponent(`${options.title} - ${options.url}`)}`
    }
  ];

  const handleShare = (platform: typeof socialPlatforms[0]) => {
    const shareUrl = platform.shareUrl(shareOptions);
    window.open(shareUrl, '_blank', 'width=600,height=400');
    setIsOpen(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied to clipboard!', {
        icon: '📋',
        duration: 2000
      });
      setTimeout(() => setCopied(false), 2000);
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to copy link', {
        icon: '❌',
        duration: 3000
      });
    }
  };

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        <span className="text-sm font-medium text-gray-700">Share:</span>
        {socialPlatforms.map((platform) => (
          <button
            key={platform.name}
            onClick={() => handleShare(platform)}
            className={cn(
              'p-2 rounded-full transition-colors',
              platform.color
            )}
            title={`Share on ${platform.name}`}
          >
            <platform.icon className="h-4 w-4" />
          </button>
        ))}
        <button
          onClick={handleCopyLink}
          className="p-2 rounded-full text-gray-600 hover:bg-gray-50 transition-colors"
          title="Copy link"
        >
          {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        size={size}
        className="flex items-center"
      >
        <Share2 className="h-4 w-4 mr-2" />
        Share
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-20">
            <div className="py-2">
              {socialPlatforms.map((platform) => (
                <button
                  key={platform.name}
                  onClick={() => handleShare(platform)}
                  className={cn(
                    'w-full flex items-center px-4 py-2 text-sm transition-colors',
                    platform.color
                  )}
                >
                  <platform.icon className="h-4 w-4 mr-3" />
                  Share on {platform.name}
                </button>
              ))}
              
              <hr className="my-2" />
              
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-3 text-green-600" />
                    Link copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-3" />
                    Copy link
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SocialShare;
