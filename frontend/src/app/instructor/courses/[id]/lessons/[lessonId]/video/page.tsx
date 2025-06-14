'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth, useAuthActions } from '@/store/authStore';
import {
  ArrowLeft,
  Upload,
  Trash2,
  FileVideo,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import InstructorNavbar from '@/components/instructor/InstructorNavbar';
import { lessonApi, Lesson } from '@/services/lessonApi';
import { instructorDashboardApi } from '@/services/instructorDashboardApi';
import { toast } from 'react-hot-toast';

const VideoUploadPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const courseId = params?.id as string;
  const lessonId = params?.lessonId as string;
  const { user, isAuthenticated, isLoading } = useAuth();
  const { initializeAuth } = useAuthActions();
  const [authChecked, setAuthChecked] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [course, setCourse] = useState<any>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated && !isLoading) {
        await initializeAuth();
      }
      setAuthChecked(true);
    };

    checkAuth();
  }, [isAuthenticated, isLoading, initializeAuth]);

  // Redirect if not authenticated or not instructor
  useEffect(() => {
    if (authChecked && (!isAuthenticated || user?.role !== 'instructor')) {
      router.push('/auth/login');
    }
  }, [authChecked, isAuthenticated, user, router]);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!authChecked || !isAuthenticated || user?.role !== 'instructor') return;

      try {
        setPageLoading(true);

        // Load course info
        const courseData = await instructorDashboardApi.getCourse(courseId);
        setCourse(courseData);

        // Load lesson data
        const lessonData = await lessonApi.getLesson(courseId, lessonId);
        setLesson(lessonData);

      } catch (error: any) {
        console.error('Failed to load data:', error);
        toast.error('Không thể tải dữ liệu');
        router.push(`/instructor/courses/${courseId}/lessons`);
      } finally {
        setPageLoading(false);
      }
    };

    loadData();
  }, [authChecked, isAuthenticated, user, courseId, lessonId, router]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/avi', 'video/mov', 'video/wmv'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Chỉ hỗ trợ các định dạng video: MP4, WebM, AVI, MOV, WMV');
      return;
    }

    // Validate file size (500MB)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      toast.error('Kích thước file không được vượt quá 500MB');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Vui lòng chọn file video');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      await lessonApi.uploadVideo(courseId, lessonId, selectedFile, (progress) => {
        setUploadProgress(progress);
      });

      toast.success('Upload video thành công!');
      
      // Reload lesson data to get updated video info
      const updatedLesson = await lessonApi.getLesson(courseId, lessonId);
      setLesson(updatedLesson);
      setSelectedFile(null);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error: any) {
      console.error('Failed to upload video:', error);
      toast.error(error.response?.data?.message || 'Không thể upload video');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveVideo = async () => {
    if (!lesson?.videoUrl) return;

    if (!confirm('Bạn có chắc chắn muốn xóa video này? Hành động này không thể hoàn tác.')) {
      return;
    }

    try {
      // Use the dedicated delete video endpoint
      const updatedLesson = await lessonApi.deleteVideo(courseId, lessonId);
      setLesson(updatedLesson);

      toast.success('Đã xóa video thành công');

    } catch (error: any) {
      console.error('Failed to remove video:', error);
      toast.error(error.response?.data?.message || 'Không thể xóa video');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  };

  // Show loading while checking auth or loading data
  if (!authChecked || isLoading || pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <InstructorNavbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            <span className="text-lg text-gray-600">Đang tải...</span>
          </div>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated or not instructor (will redirect)
  if (!isAuthenticated || user?.role !== 'instructor' || !course || !lesson) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <InstructorNavbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => router.push(`/instructor/courses/${courseId}/lessons`)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại danh sách
            </button>
          </div>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý Video</h1>
            <p className="mt-2 text-gray-600">
              Khóa học: {course.title}
            </p>
            <p className="text-sm text-gray-500">
              Bài học #{lesson.order}: {lesson.title}
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Current Video */}
          {lesson.videoUrl ? (
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Video hiện tại</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Video Preview */}
                <div>
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    {lesson.videoUrl && (lesson.videoUrl.startsWith('http') || lesson.videoUrl.startsWith('/videos/')) ? (
                      <video
                        controls
                        className="w-full h-full rounded-lg"
                        poster={lesson.videoThumbnail}
                      >
                        <source src={lesson.videoUrl} type={`video/${lesson.videoFormat}`} />
                        Trình duyệt của bạn không hỗ trợ video.
                      </video>
                    ) : (
                      <div className="text-center">
                        <FileVideo className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-500">Video đã upload</p>
                        <p className="text-xs text-gray-400">{lesson.videoFormat?.toUpperCase()}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Video Info */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium text-green-700">Video đã được upload</span>
                  </div>

                  <div className="space-y-3">
                    {lesson.videoFormat && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Định dạng:</span>
                        <span className="text-sm font-medium">{lesson.videoFormat.toUpperCase()}</span>
                      </div>
                    )}

                    {lesson.videoSize && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Kích thước:</span>
                        <span className="text-sm font-medium">{formatFileSize(lesson.videoSize)}</span>
                      </div>
                    )}

                    {lesson.videoDuration && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Thời lượng:</span>
                        <span className="text-sm font-medium">{formatDuration(lesson.videoDuration)}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t">
                    <button
                      onClick={handleRemoveVideo}
                      className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Xóa video
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow-sm rounded-lg p-6">
              <div className="text-center">
                <FileVideo className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có video</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Upload video để học viên có thể xem bài học này.
                </p>
              </div>
            </div>
          )}

          {/* Upload New Video */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {lesson.videoUrl ? 'Thay thế video' : 'Upload video mới'}
            </h2>

            {!uploading ? (
              <div className="space-y-6">
                {/* File Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chọn file video
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/avi,video/mov,video/wmv"
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Hỗ trợ: MP4, WebM, AVI, MOV, WMV. Tối đa 500MB.
                  </p>
                </div>

                {/* Selected File Info */}
                {selectedFile && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">File đã chọn:</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Tên file:</span>
                        <span className="text-sm font-medium">{selectedFile.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Kích thước:</span>
                        <span className="text-sm font-medium">{formatFileSize(selectedFile.size)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Loại:</span>
                        <span className="text-sm font-medium">{selectedFile.type}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Upload Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleUpload}
                    disabled={!selectedFile}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Video
                  </button>
                </div>
              </div>
            ) : (
              /* Upload Progress */
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">Đang upload video...</span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>

                <div className="flex justify-between text-sm text-gray-500">
                  <span>Tiến độ upload</span>
                  <span>{uploadProgress}%</span>
                </div>

                {selectedFile && (
                  <div className="text-sm text-gray-500">
                    Đang upload: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Upload Guidelines */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Hướng dẫn upload video</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Chọn video chất lượng tốt để đảm bảo trải nghiệm học tập</li>
                    <li>Độ phân giải khuyến nghị: 720p (HD) hoặc cao hơn</li>
                    <li>Đảm bảo âm thanh rõ ràng và đồng bộ với hình ảnh</li>
                    <li>Kiểm tra nội dung video trước khi upload</li>
                    <li>Video sẽ được lưu trữ an toàn trên server</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoUploadPage;
