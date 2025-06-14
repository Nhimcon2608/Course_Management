'use client';

import React, { useState, useEffect } from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  className?: string;
}

// Function to extract YouTube video ID from various YouTube URL formats
function getYouTubeVideoId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Function to check if URL is a YouTube URL
function isYouTubeUrl(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be');
}

// Function to convert YouTube URL to embed URL
function getYouTubeEmbedUrl(url: string): string | null {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;
  
  return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}`;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  title,
  onPlay,
  onPause,
  onEnded,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    
    if (isYouTubeUrl(videoUrl)) {
      const youtubeEmbedUrl = getYouTubeEmbedUrl(videoUrl);
      if (youtubeEmbedUrl) {
        setEmbedUrl(youtubeEmbedUrl);
      } else {
        setHasError(true);
      }
    } else {
      setEmbedUrl(null);
    }
    
    setIsLoading(false);
  }, [videoUrl]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    if (onPlay) {
      onPlay();
    }
  };

  const handleVideoPlay = () => {
    if (onPlay) {
      onPlay();
    }
  };

  const handleVideoPause = () => {
    if (onPause) {
      onPause();
    }
  };

  const handleVideoEnded = () => {
    if (onEnded) {
      onEnded();
    }
  };

  if (!videoUrl) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 ${className}`}>
        <div className="text-center text-gray-400">
          <DocumentTextIcon className="h-16 w-16 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No video available</h3>
          <p className="text-sm">This lesson content is not available yet.</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 ${className}`}>
        <div className="text-center text-gray-400">
          <DocumentTextIcon className="h-16 w-16 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Video Error</h3>
          <p className="text-sm">Unable to load video content.</p>
          <p className="text-xs mt-2 text-gray-500">URL: {videoUrl}</p>
        </div>
      </div>
    );
  }

  // YouTube video
  if (isYouTubeUrl(videoUrl) && embedUrl) {
    return (
      <div className={`relative bg-black ${className}`}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center text-gray-400">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-sm">Loading video...</p>
            </div>
          </div>
        )}
        <iframe
          src={embedUrl}
          title={title}
          className="w-full h-full min-h-[400px] md:min-h-[500px]"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          onLoad={handleIframeLoad}
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  // Regular video file
  return (
    <div className={`relative bg-black ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center text-gray-400">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-sm">Loading video...</p>
          </div>
        </div>
      )}
      <video
        className="w-full h-full min-h-[400px] md:min-h-[500px] object-contain"
        controls
        onPlay={handleVideoPlay}
        onPause={handleVideoPause}
        onEnded={handleVideoEnded}
        onLoadStart={() => setIsLoading(true)}
        onLoadedData={() => setIsLoading(false)}
        onError={() => setHasError(true)}
      >
        <source src={videoUrl} type="video/mp4" />
        <source src={videoUrl} type="video/webm" />
        <source src={videoUrl} type="video/ogg" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoPlayer;
