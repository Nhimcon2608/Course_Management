'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  GraduationCap,
  Link as LinkIcon,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  currentTitle: string;
  company: string;
  experience: string;
  expertise: string[];
  bio: string;
  teachingExperience: string;
  motivation: string;
  sampleCourseTitle: string;
  sampleCourseDescription: string;
  linkedin: string;
  website: string;
  github: string;
  portfolio: string;
  hearAboutUs: string;
  agreedToTerms: boolean;
}

const expertiseOptions = [
  'Web Development', 'Mobile Development', 'Data Science', 'Machine Learning',
  'UX/UI Design', 'DevOps', 'Cybersecurity', 'Cloud Computing',
  'Product Management', 'Digital Marketing', 'Business Strategy',
  'Photography', 'Video Editing', 'Graphic Design', 'Writing',
  'Languages', 'Music', 'Art', 'Other'
];

const InstructorApplicationForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    currentTitle: '',
    company: '',
    experience: '',
    expertise: [],
    bio: '',
    teachingExperience: '',
    motivation: '',
    sampleCourseTitle: '',
    sampleCourseDescription: '',
    linkedin: '',
    website: '',
    github: '',
    portfolio: '',
    hearAboutUs: '',
    agreedToTerms: false
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const totalSteps = 4;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleExpertiseChange = (expertise: string) => {
    setFormData(prev => ({
      ...prev,
      expertise: prev.expertise.includes(expertise)
        ? prev.expertise.filter(e => e !== expertise)
        : [...prev.expertise, expertise]
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.firstName && formData.lastName && formData.email && formData.location);
      case 2:
        return !!(formData.currentTitle && formData.experience && formData.expertise.length > 0 && formData.bio);
      case 3:
        return !!(formData.motivation);
      case 4:
        return formData.agreedToTerms;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/instructors/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsSubmitted(true);
        toast.success('Application submitted successfully!');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-8 shadow-lg text-center max-w-2xl mx-auto"
      >
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Application Submitted!
        </h2>
        <p className="text-gray-600 mb-6 leading-relaxed">
          Thank you for your interest in becoming an instructor. We've received your application and will review it within 3-5 business days. You'll receive an email notification once we've made a decision.
        </p>
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">What's Next?</h3>
          <ul className="text-sm text-blue-800 space-y-1 text-left">
            <li>• Our team will review your application</li>
            <li>• We may contact you for additional information</li>
            <li>• If approved, you'll receive onboarding instructions</li>
            <li>• You can start creating your first course!</li>
          </ul>
        </div>
        <button
          onClick={() => window.location.href = '/'}
          className="btn-primary px-6 py-3"
        >
          Return to Home
        </button>
      </motion.div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Progress Bar */}
      <div className="bg-gray-50 px-8 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round((currentStep / totalSteps) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8">
        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Personal Information</h2>
              <p className="text-gray-600">Let's start with some basic information about you.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="input pl-10"
                    placeholder="Enter your first name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="input pl-10"
                    placeholder="Enter your last name"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input pl-10"
                  placeholder="Enter your email address"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="input pl-10"
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="input pl-10"
                    placeholder="City, Country"
                    required
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Professional Information */}
        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Professional Information</h2>
              <p className="text-gray-600">Tell us about your professional background and expertise.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Title *
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="currentTitle"
                    value={formData.currentTitle}
                    onChange={handleInputChange}
                    className="input pl-10"
                    placeholder="e.g., Senior Software Engineer"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Current or most recent company"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Years of Experience *
              </label>
              <select
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                className="input"
                required
              >
                <option value="">Select your experience level</option>
                <option value="1-2 years">1-2 years</option>
                <option value="3-5 years">3-5 years</option>
                <option value="6-10 years">6-10 years</option>
                <option value="10+ years">10+ years</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Areas of Expertise * (Select all that apply)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                {expertiseOptions.map((option) => (
                  <label key={option} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.expertise.includes(option)}
                      onChange={() => handleExpertiseChange(option)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Professional Bio *
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={4}
                className="input"
                placeholder="Tell us about your professional background, achievements, and what makes you qualified to teach..."
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.bio.length}/1000 characters
              </p>
            </div>
          </motion.div>
        )}

        {/* Step 3: Teaching Information */}
        {currentStep === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Teaching Information</h2>
              <p className="text-gray-600">Help us understand your teaching goals and approach.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teaching Experience
              </label>
              <textarea
                name="teachingExperience"
                value={formData.teachingExperience}
                onChange={handleInputChange}
                rows={3}
                className="input"
                placeholder="Describe any previous teaching, mentoring, or training experience (formal or informal)..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Why do you want to become an instructor? *
              </label>
              <textarea
                name="motivation"
                value={formData.motivation}
                onChange={handleInputChange}
                rows={4}
                className="input"
                placeholder="Share your motivation for teaching and what you hope to achieve as an instructor..."
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sample Course Title
                </label>
                <input
                  type="text"
                  name="sampleCourseTitle"
                  value={formData.sampleCourseTitle}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="What would you like to teach?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How did you hear about us?
                </label>
                <select
                  name="hearAboutUs"
                  value={formData.hearAboutUs}
                  onChange={handleInputChange}
                  className="input"
                >
                  <option value="">Select an option</option>
                  <option value="Google Search">Google Search</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Friend/Colleague">Friend/Colleague</option>
                  <option value="Online Ad">Online Advertisement</option>
                  <option value="Blog/Article">Blog/Article</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sample Course Description
              </label>
              <textarea
                name="sampleCourseDescription"
                value={formData.sampleCourseDescription}
                onChange={handleInputChange}
                rows={4}
                className="input"
                placeholder="Briefly describe what your course would cover and who it would be for..."
              />
            </div>
          </motion.div>
        )}

        {/* Step 4: Links and Agreement */}
        {currentStep === 4 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Social Links & Agreement</h2>
              <p className="text-gray-600">Share your professional profiles and agree to our terms.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn Profile
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="url"
                    name="linkedin"
                    value={formData.linkedin}
                    onChange={handleInputChange}
                    className="input pl-10"
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Personal Website
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="input pl-10"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GitHub Profile
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="url"
                    name="github"
                    value={formData.github}
                    onChange={handleInputChange}
                    className="input pl-10"
                    placeholder="https://github.com/yourusername"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Portfolio
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="url"
                    name="portfolio"
                    value={formData.portfolio}
                    onChange={handleInputChange}
                    className="input pl-10"
                    placeholder="https://yourportfolio.com"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Terms and Conditions</h3>
              <div className="text-sm text-gray-600 space-y-2 mb-4">
                <p>By submitting this application, you agree to:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Provide accurate and truthful information</li>
                  <li>Create high-quality, original educational content</li>
                  <li>Respect intellectual property rights</li>
                  <li>Maintain professional conduct with students</li>
                  <li>Follow our community guidelines and policies</li>
                </ul>
              </div>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="agreedToTerms"
                  checked={formData.agreedToTerms}
                  onChange={handleInputChange}
                  className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  required
                />
                <span className="text-sm text-gray-700">
                  I agree to the terms and conditions and confirm that all information provided is accurate. *
                </span>
              </label>
            </div>
          </motion.div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={nextStep}
              className="btn-primary"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting || !validateStep(currentStep)}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center space-x-2">
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Submitting...</span>
                </span>
              ) : (
                'Submit Application'
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default InstructorApplicationForm;
