'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useAuthActions } from '@/store/authStore';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Linkedin, 
  Twitter, 
  Github,
  Edit,
  Save,
  X,
  Camera,
  Award,
  BookOpen,
  Users,
  DollarSign,
  Star,
  Calendar,
  Plus,
  Trash2
} from 'lucide-react';
import InstructorNavbar from '@/components/instructor/InstructorNavbar';
import { instructorDashboardApi, InstructorProfile, UpdateProfileData } from '@/services/instructorDashboardApi';
import { toast } from 'react-hot-toast';

const InstructorProfilePage: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { initializeAuth } = useAuthActions();
  const [authChecked, setAuthChecked] = useState(false);

  // Profile data state
  const [profile, setProfile] = useState<InstructorProfile | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<UpdateProfileData>({});

  // Initialize auth on component mount
  useEffect(() => {
    console.log('Instructor Profile: Initializing auth...');
    initializeAuth();

    const timer = setTimeout(() => {
      setAuthChecked(true);
      console.log('Instructor Profile: Auth check complete');
    }, 500);

    return () => clearTimeout(timer);
  }, [initializeAuth]);

  // Handle redirect if not authenticated or not instructor
  useEffect(() => {
    if (authChecked && !isLoading) {
      if (!isAuthenticated) {
        console.log('Instructor Profile: Not authenticated, redirecting to login');
        router.push('/auth/login?redirect=/instructor/profile');
        return;
      }

      if (user?.role !== 'instructor') {
        console.log('Instructor Profile: Not instructor, redirecting to appropriate dashboard');
        const redirectUrl = user?.role === 'admin' ? '/admin/dashboard' : '/dashboard';
        router.push(redirectUrl);
        return;
      }

      // Load profile data if user is instructor
      loadProfile();
    }
  }, [authChecked, isAuthenticated, isLoading, user, router]);

  const loadProfile = async () => {
    try {
      setDataLoading(true);
      const profileData = await instructorDashboardApi.getProfile();
      setProfile(profileData);
      
      // Initialize edit form with current data
      setEditForm({
        name: profileData.name,
        bio: profileData.bio || '',
        phone: profileData.phone || '',
        address: profileData.address || '',
        city: profileData.city || '',
        country: profileData.country || 'Vietnam',
        expertise: profileData.expertise || [],
        qualifications: profileData.qualifications || [],
        yearsOfExperience: profileData.yearsOfExperience || 0,
        socialLinks: profileData.socialLinks || {}
      });
    } catch (error: any) {
      console.error('Failed to load profile:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load profile data. Please check your connection and try again.';
      toast.error(errorMessage);
      setProfile(null);
    } finally {
      setDataLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const updatedProfile = await instructorDashboardApi.updateProfile(editForm);
      setProfile(updatedProfile);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      toast.error(errorMessage);
    }
  };

  const handleCancelEdit = () => {
    if (profile) {
      setEditForm({
        name: profile.name,
        bio: profile.bio || '',
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        country: profile.country || 'Vietnam',
        expertise: profile.expertise || [],
        qualifications: profile.qualifications || [],
        yearsOfExperience: profile.yearsOfExperience || 0,
        socialLinks: profile.socialLinks || {}
      });
    }
    setIsEditing(false);
  };

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    try {
      const result = await instructorDashboardApi.uploadProfilePicture(file);

      // Update profile state with new avatar
      if (profile) {
        setProfile(prev => prev ? { ...prev, avatar: result.url } : null);
      }

      toast.success('Profile picture updated successfully');
    } catch (error: any) {
      console.error('Failed to upload profile picture:', error);
      const errorMessage = error.response?.data?.message || 'Failed to upload profile picture';
      toast.error(errorMessage);
    }
  };

  const addExpertise = () => {
    setEditForm(prev => ({
      ...prev,
      expertise: [...(prev.expertise || []), '']
    }));
  };

  const updateExpertise = (index: number, value: string) => {
    setEditForm(prev => ({
      ...prev,
      expertise: prev.expertise?.map((item, i) => i === index ? value : item) || []
    }));
  };

  const removeExpertise = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      expertise: prev.expertise?.filter((_, i) => i !== index) || []
    }));
  };

  const addQualification = () => {
    setEditForm(prev => ({
      ...prev,
      qualifications: [...(prev.qualifications || []), '']
    }));
  };

  const updateQualification = (index: number, value: string) => {
    setEditForm(prev => ({
      ...prev,
      qualifications: prev.qualifications?.map((item, i) => i === index ? value : item) || []
    }));
  };

  const removeQualification = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      qualifications: prev.qualifications?.filter((_, i) => i !== index) || []
    }));
  };

  // Show loading while checking auth or loading data
  if (!authChecked || isLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <InstructorNavbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated or not instructor (will redirect)
  if (!isAuthenticated || user?.role !== 'instructor') {
    return null;
  }

  // Show error state if profile failed to load
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <InstructorNavbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Failed to Load Profile</h1>
            <p className="text-gray-600 mb-4">Unable to load your profile data. Please try again.</p>
            <button
              onClick={loadProfile}
              className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <InstructorNavbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Instructor Profile</h1>
              <p className="text-gray-600 mt-2">
                Manage your profile information and teaching credentials
              </p>
            </div>
            <div className="flex space-x-3">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSaveProfile}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <p className="text-gray-900 flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    {profile.email}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editForm.phone || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="+84 123 456 789"
                    />
                  ) : (
                    <p className="text-gray-900 flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      {profile.phone || 'Not provided'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Years of Experience
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={editForm.yearsOfExperience || 0}
                      onChange={(e) => setEditForm(prev => ({ ...prev, yearsOfExperience: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.yearsOfExperience || 0} years</p>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                {isEditing ? (
                  <textarea
                    value={editForm.bio || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Tell students about yourself, your experience, and teaching philosophy..."
                  />
                ) : (
                  <p className="text-gray-900">{profile.bio || 'No bio provided'}</p>
                )}
              </div>
            </div>

            {/* Location Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.address || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Street address"
                    />
                  ) : (
                    <p className="text-gray-900 flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      {profile.address || 'Not provided'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.city || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="City"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.city || 'Not provided'}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  {isEditing ? (
                    <select
                      value={editForm.country || 'Vietnam'}
                      onChange={(e) => setEditForm(prev => ({ ...prev, country: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="Vietnam">Vietnam</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Canada">Canada</option>
                      <option value="Australia">Australia</option>
                      <option value="Singapore">Singapore</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <p className="text-gray-900">{profile.country || 'Vietnam'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Expertise */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Areas of Expertise</h2>
                {isEditing && (
                  <button
                    onClick={addExpertise}
                    className="flex items-center text-sm text-primary-600 hover:text-primary-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Expertise
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  {(editForm.expertise || []).map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => updateExpertise(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="e.g., React, Node.js, Python"
                      />
                      <button
                        onClick={() => removeExpertise(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {(editForm.expertise || []).length === 0 && (
                    <p className="text-gray-500 text-sm">No expertise areas added yet.</p>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(profile.expertise || []).map((item, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
                    >
                      {item}
                    </span>
                  ))}
                  {(profile.expertise || []).length === 0 && (
                    <p className="text-gray-500">No expertise areas specified</p>
                  )}
                </div>
              )}
            </div>

            {/* Qualifications */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Qualifications & Certifications</h2>
                {isEditing && (
                  <button
                    onClick={addQualification}
                    className="flex items-center text-sm text-primary-600 hover:text-primary-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Qualification
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  {(editForm.qualifications || []).map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => updateQualification(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="e.g., Bachelor of Computer Science, AWS Certified Developer"
                      />
                      <button
                        onClick={() => removeQualification(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {(editForm.qualifications || []).length === 0 && (
                    <p className="text-gray-500 text-sm">No qualifications added yet.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {(profile.qualifications || []).map((item, index) => (
                    <div key={index} className="flex items-center">
                      <Award className="h-4 w-4 text-yellow-600 mr-2" />
                      <span className="text-gray-900">{item}</span>
                    </div>
                  ))}
                  {(profile.qualifications || []).length === 0 && (
                    <p className="text-gray-500">No qualifications specified</p>
                  )}
                </div>
              )}
            </div>

            {/* Social Links */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Social Links</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={editForm.socialLinks?.website || ''}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        socialLinks: { ...prev.socialLinks, website: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="https://your-website.com"
                    />
                  ) : (
                    <p className="text-gray-900 flex items-center">
                      <Globe className="h-4 w-4 mr-2 text-gray-400" />
                      {profile.socialLinks?.website ? (
                        <a
                          href={profile.socialLinks.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700"
                        >
                          {profile.socialLinks.website}
                        </a>
                      ) : (
                        'Not provided'
                      )}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LinkedIn
                  </label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={editForm.socialLinks?.linkedin || ''}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        socialLinks: { ...prev.socialLinks, linkedin: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="https://linkedin.com/in/username"
                    />
                  ) : (
                    <p className="text-gray-900 flex items-center">
                      <Linkedin className="h-4 w-4 mr-2 text-gray-400" />
                      {profile.socialLinks?.linkedin ? (
                        <a
                          href={profile.socialLinks.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700"
                        >
                          LinkedIn Profile
                        </a>
                      ) : (
                        'Not provided'
                      )}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Twitter
                  </label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={editForm.socialLinks?.twitter || ''}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        socialLinks: { ...prev.socialLinks, twitter: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="https://twitter.com/username"
                    />
                  ) : (
                    <p className="text-gray-900 flex items-center">
                      <Twitter className="h-4 w-4 mr-2 text-gray-400" />
                      {profile.socialLinks?.twitter ? (
                        <a
                          href={profile.socialLinks.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700"
                        >
                          Twitter Profile
                        </a>
                      ) : (
                        'Not provided'
                      )}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GitHub
                  </label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={editForm.socialLinks?.github || ''}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        socialLinks: { ...prev.socialLinks, github: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="https://github.com/username"
                    />
                  ) : (
                    <p className="text-gray-900 flex items-center">
                      <Github className="h-4 w-4 mr-2 text-gray-400" />
                      {profile.socialLinks?.github ? (
                        <a
                          href={profile.socialLinks.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700"
                        >
                          GitHub Profile
                        </a>
                      ) : (
                        'Not provided'
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Stats and Avatar */}
          <div className="space-y-6">
            {/* Profile Picture */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Picture</h3>
              <div className="text-center">
                <div className="relative inline-block">
                  <img
                    src={profile.avatar || '/images/default-avatar.png'}
                    alt={profile.name}
                    className="h-32 w-32 rounded-full object-cover mx-auto"
                  />
                  {isEditing && (
                    <>
                      <input
                        type="file"
                        id="avatar-upload"
                        accept="image/*"
                        onChange={handleProfilePictureUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="avatar-upload"
                        className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700 cursor-pointer"
                      >
                        <Camera className="h-4 w-4" />
                      </label>
                    </>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {profile.name}
                </p>
                <p className="text-xs text-primary-600 font-medium">
                  Instructor
                </p>
                {isEditing && (
                  <p className="text-xs text-gray-500 mt-1">
                    Click the camera icon to upload a new picture
                  </p>
                )}
              </div>
            </div>

            {/* Teaching Statistics */}
            {profile.teachingStats && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Teaching Statistics</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <BookOpen className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="text-sm text-gray-600">Total Courses</span>
                    </div>
                    <span className="font-semibold text-gray-900">{profile.teachingStats.totalCourses}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Users className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-sm text-gray-600">Students Taught</span>
                    </div>
                    <span className="font-semibold text-gray-900">{profile.teachingStats.totalStudents}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-yellow-600 mr-2" />
                      <span className="text-sm text-gray-600">Average Rating</span>
                    </div>
                    <span className="font-semibold text-gray-900">{profile.teachingStats.averageRating}/5</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-purple-600 mr-2" />
                      <span className="text-sm text-gray-600">Total Revenue</span>
                    </div>
                    <span className="font-semibold text-gray-900">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(profile.teachingStats.totalRevenue)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Account Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Member Since</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Login</span>
                  <span className="text-sm font-medium text-gray-900">
                    {profile.lastLogin ? new Date(profile.lastLogin).toLocaleDateString() : 'Never'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Email Verified</span>
                  <span className={`text-sm font-medium ${profile.isEmailVerified ? 'text-green-600' : 'text-red-600'}`}>
                    {profile.isEmailVerified ? 'Verified' : 'Not Verified'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorProfilePage;
