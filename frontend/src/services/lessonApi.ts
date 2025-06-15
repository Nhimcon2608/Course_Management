import { apiClient } from '@/lib/api';

export interface Lesson {
  _id: string;
  course: string;
  title: string;
  description?: string;
  content?: string;
  videoUrl?: string;
  videoThumbnail?: string;
  videoDuration?: number;
  videoSize?: number;
  videoFormat?: string;
  order: number;
  duration: number;
  isPreview: boolean;
  isPublished: boolean;
  resources?: Array<{
    title: string;
    url: string;
    type: 'pdf' | 'doc' | 'link' | 'image' | 'other';
    size?: number;
  }>;
  assignments?: Assignment[];
  assignmentCount: number;
  completionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  _id: string;
  lesson: string;
  course: string;
  title: string;
  description?: string;
  instructions?: string;
  questions: Question[];
  totalPoints: number;
  passingScore: number;
  timeLimit?: number;
  attempts: number;
  deadline?: string;
  isPublished: boolean;
  autoGrade: boolean;
  showResults: boolean;
  showCorrectAnswers: boolean;
  submissionCount: number;
  averageScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  _id?: string;
  type: 'multiple_choice' | 'text' | 'file_upload' | 'essay';
  question: string;
  options?: string[];
  correctAnswer?: string | number;
  points: number;
  required: boolean;
  explanation?: string;
}

export interface CreateLessonData {
  title: string;
  description?: string;
  content?: string;
  order?: number;
  duration: number;
  isPreview?: boolean;
  isPublished?: boolean;
  resources?: Array<{
    title: string;
    url: string;
    type: 'pdf' | 'doc' | 'link' | 'image' | 'other';
    size?: number;
  }>;
}

export interface UpdateLessonData extends Partial<CreateLessonData> {}

export interface CreateAssignmentData {
  title: string;
  description?: string;
  instructions?: string;
  questions: Omit<Question, '_id'>[];
  totalPoints?: number;
  passingScore?: number;
  timeLimit?: number;
  attempts?: number;
  deadline?: string;
  isPublished?: boolean;
  autoGrade?: boolean;
  showResults?: boolean;
  showCorrectAnswers?: boolean;
}

export interface UpdateAssignmentData extends Partial<CreateAssignmentData> {}

class LessonAPI {
  private baseUrl = '/instructor';

  // Lesson Management
  async getLessons(courseId: string): Promise<{ lessons: Lesson[]; total: number }> {
    const response = await apiClient.get(`${this.baseUrl}/courses/${courseId}/lessons`);
    const data = response.data as any;

    if (data && data.data) {
      return data.data;
    } else if (data && Array.isArray(data.lessons)) {
      return data;
    } else {
      throw new Error('Invalid response format');
    }
  }

  async getLesson(courseId: string, lessonId: string): Promise<Lesson> {
    const response = await apiClient.get(`${this.baseUrl}/courses/${courseId}/lessons/${lessonId}`);
    const data = response.data as any;

    if (data && data.data) {
      return data.data;
    } else if (data && data._id) {
      return data;
    } else {
      throw new Error('Invalid response format');
    }
  }

  async createLesson(courseId: string, lessonData: CreateLessonData): Promise<Lesson> {
    const response = await apiClient.post(`${this.baseUrl}/courses/${courseId}/lessons`, lessonData);
    const data = response.data as any;

    if (data && data.data) {
      return data.data;
    } else if (data && data._id) {
      return data;
    } else {
      throw new Error('Invalid response format');
    }
  }

  async updateLesson(courseId: string, lessonId: string, lessonData: UpdateLessonData): Promise<Lesson> {
    const response = await apiClient.put(`${this.baseUrl}/courses/${courseId}/lessons/${lessonId}`, lessonData);
    const data = response.data as any;

    if (data && data.data) {
      return data.data;
    } else if (data && data._id) {
      return data;
    } else {
      throw new Error('Invalid response format');
    }
  }

  async deleteLesson(courseId: string, lessonId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/courses/${courseId}/lessons/${lessonId}`);
  }

  async reorderLessons(courseId: string, lessonOrders: Array<{ lessonId: string; order: number }>): Promise<void> {
    await apiClient.post(`${this.baseUrl}/courses/${courseId}/lessons/reorder`, { lessonOrders });
  }

  // Video Management
  async uploadVideo(courseId: string, lessonId: string, videoFile: File, onProgress?: (progress: number) => void): Promise<{
    videoUrl: string;
    videoSize: number;
    videoFormat: string;
  }> {
    const formData = new FormData();
    formData.append('video', videoFile);

    const response = await apiClient.post(
      `${this.baseUrl}/courses/${courseId}/lessons/${lessonId}/video`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent: any) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      }
    );

    // Handle different response formats
    const responseData = response.data as any;

    // Debug logging for troubleshooting
    console.log('Video upload response data:', responseData);

    // Standard API response format: { success: true, message: "...", data: {...} }
    if (responseData && responseData.success && responseData.data) {
      return responseData.data;
    }

    // Direct data format (fallback)
    if (responseData && responseData.videoUrl) {
      return {
        videoUrl: responseData.videoUrl,
        videoSize: responseData.videoSize || 0,
        videoFormat: responseData.videoFormat || ''
      };
    }

    // Error case - provide detailed information
    console.error('Unexpected video upload response format:', responseData);
    throw new Error(`Invalid response format. Expected {success: true, data: {...}} but got: ${JSON.stringify(responseData)}`);
  }

  async updateVideoMetadata(courseId: string, lessonId: string, metadata: {
    videoDuration?: number;
    videoThumbnail?: string;
  }): Promise<Lesson> {
    const response = await apiClient.put(
      `${this.baseUrl}/courses/${courseId}/lessons/${lessonId}/video/metadata`,
      metadata
    );
    const data = response.data as any;

    if (data && data.data) {
      return data.data;
    } else if (data && data._id) {
      return data;
    } else {
      throw new Error('Invalid response format');
    }
  }

  async deleteVideo(courseId: string, lessonId: string): Promise<Lesson> {
    const response = await apiClient.delete(
      `${this.baseUrl}/courses/${courseId}/lessons/${lessonId}/video`
    );

    if (response.data && (response.data as any).data) {
      return (response.data as any).data;
    } else if (response.data && (response.data as any)._id) {
      return response.data as Lesson;
    } else {
      throw new Error('Invalid response format');
    }
  }

  // Assignment Management
  async getAssignments(courseId: string, lessonId: string): Promise<{ assignments: Assignment[]; total: number }> {
    const response = await apiClient.get(`${this.baseUrl}/courses/${courseId}/lessons/${lessonId}/assignments`);
    const data = response.data as any;

    if (data && data.data) {
      return data.data;
    } else if (data && Array.isArray(data.assignments)) {
      return data;
    } else {
      throw new Error('Invalid response format');
    }
  }

  async createAssignment(courseId: string, lessonId: string, assignmentData: CreateAssignmentData): Promise<Assignment> {
    // Debug logging
    console.log('Creating assignment with data:', {
      courseId,
      lessonId,
      title: assignmentData.title,
      questionsCount: assignmentData.questions?.length || 0,
      totalPoints: assignmentData.totalPoints,
      hasQuestions: !!assignmentData.questions,
      dataKeys: Object.keys(assignmentData)
    });

    const response = await apiClient.post(
      `${this.baseUrl}/courses/${courseId}/lessons/${lessonId}/assignments`,
      assignmentData
    );
    const data = response.data as any;

    if (data && data.data) {
      return data.data;
    } else if (data && data._id) {
      return data;
    } else {
      throw new Error('Invalid response format');
    }
  }

  async updateAssignment(courseId: string, assignmentId: string, assignmentData: UpdateAssignmentData): Promise<Assignment> {
    const response = await apiClient.put(
      `${this.baseUrl}/courses/${courseId}/assignments/${assignmentId}`,
      assignmentData
    );
    const data = response.data as any;

    if (data && data.data) {
      return data.data;
    } else if (data && data._id) {
      return data;
    } else {
      throw new Error('Invalid response format');
    }
  }

  async deleteAssignment(courseId: string, assignmentId: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/courses/${courseId}/assignments/${assignmentId}`);
  }
}

export const lessonApi = new LessonAPI();
