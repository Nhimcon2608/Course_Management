'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Star, 
  Users, 
  BookOpen, 
  MapPin, 
  Award,
  ExternalLink,
  Linkedin,
  Globe,
  Github
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatNumber } from '@/lib/utils';

interface Instructor {
  _id: string;
  name: string;
  title: string;
  bio: string;
  expertise: string[];
  avatar?: string;
  rating: number;
  studentsCount: number;
  coursesCount: number;
  experience: string;
  company?: string;
  location?: string;
  featured: boolean;
  verified: boolean;
  socialLinks?: {
    linkedin?: string;
    website?: string;
    github?: string;
  };
}

interface InstructorCardProps {
  instructor: Instructor;
  layout?: 'grid' | 'list';
  showFullBio?: boolean;
}

const InstructorCard: React.FC<InstructorCardProps> = ({ 
  instructor, 
  layout = 'grid',
  showFullBio = false 
}) => {
  const {
    _id,
    name,
    title,
    bio,
    expertise,
    avatar,
    rating,
    studentsCount,
    coursesCount,
    experience,
    company,
    location,
    featured,
    verified,
    socialLinks
  } = instructor;

  const truncatedBio = bio.length > 120 ? bio.substring(0, 120) + '...' : bio;
  const displayBio = showFullBio ? bio : truncatedBio;

  if (layout === 'list') {
    return (
      <motion.div
        whileHover={{ y: -2 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 p-6"
      >
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 flex items-center justify-center text-white text-2xl font-bold">
                {avatar ? (
                  <Image
                    src={avatar}
                    alt={name}
                    width={96}
                    height={96}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  name.charAt(0).toUpperCase()
                )}
              </div>
              {featured && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Award className="h-3 w-3 text-yellow-800" />
                </div>
              )}
              {verified && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <Star className="h-3 w-3 text-white fill-current" />
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-bold text-gray-900 truncate">
                    {name}
                  </h3>
                  {verified && (
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <Star className="h-3 w-3 text-white fill-current" />
                    </div>
                  )}
                </div>

                <p className="text-primary-600 font-medium mb-2">{title}</p>
                
                {company && (
                  <p className="text-gray-600 text-sm mb-2">
                    <span className="font-medium">at {company}</span>
                  </p>
                )}

                {location && (
                  <div className="flex items-center text-gray-500 text-sm mb-3">
                    <MapPin className="h-4 w-4 mr-1" />
                    {location}
                  </div>
                )}

                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  {displayBio}
                </p>

                {/* Expertise Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {expertise.slice(0, 4).map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                  {expertise.length > 4 && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                      +{expertise.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              {/* Stats and Actions */}
              <div className="flex flex-col items-end space-y-4">
                {/* Stats */}
                <div className="flex flex-col items-end space-y-2">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="font-semibold text-gray-900">{rating}</span>
                    <span className="text-gray-500 text-sm">rating</span>
                  </div>
                  
                  <div className="flex items-center space-x-1 text-gray-600">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">{formatNumber(studentsCount)} students</span>
                  </div>
                  
                  <div className="flex items-center space-x-1 text-gray-600">
                    <BookOpen className="h-4 w-4" />
                    <span className="text-sm">{coursesCount} courses</span>
                  </div>
                </div>

                {/* Social Links */}
                {socialLinks && (
                  <div className="flex space-x-2">
                    {socialLinks.linkedin && (
                      <a
                        href={socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Linkedin className="h-4 w-4" />
                      </a>
                    )}
                    {socialLinks.website && (
                      <a
                        href={socialLinks.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <Globe className="h-4 w-4" />
                      </a>
                    )}
                    {socialLinks.github && (
                      <a
                        href={socialLinks.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
                      >
                        <Github className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                )}

                {/* Action Button */}
                <Link
                  href={`/instructors/${_id}`}
                  className="btn-primary text-sm px-4 py-2 flex items-center space-x-2"
                >
                  <span>View Profile</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Grid layout (default)
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden group"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 flex items-center justify-center text-white text-xl font-bold">
              {avatar ? (
                <Image
                  src={avatar}
                  alt={name}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                name.charAt(0).toUpperCase()
              )}
            </div>
            {featured && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                <Award className="h-3 w-3 text-yellow-800" />
              </div>
            )}
          </div>

          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="font-semibold text-gray-900">{rating}</span>
          </div>
        </div>

        {/* Name and Title */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-gray-900 truncate">
              {name}
            </h3>
            {verified && (
              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <Star className="h-2.5 w-2.5 text-white fill-current" />
              </div>
            )}
          </div>
          <p className="text-primary-600 font-medium text-sm truncate">{title}</p>
          {company && (
            <p className="text-gray-500 text-xs">at {company}</p>
          )}
        </div>

        {/* Bio */}
        <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
          {displayBio}
        </p>

        {/* Expertise */}
        <div className="flex flex-wrap gap-1 mb-4">
          {expertise.slice(0, 3).map((skill, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full"
            >
              {skill}
            </span>
          ))}
          {expertise.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
              +{expertise.length - 3}
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span>{formatNumber(studentsCount)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <BookOpen className="h-4 w-4" />
            <span>{coursesCount} courses</span>
          </div>
        </div>

        {/* Action */}
        <Link
          href={`/instructors/${_id}`}
          className="btn-primary w-full text-center text-sm py-2 group-hover:bg-primary-700 transition-colors"
        >
          View Profile
        </Link>
      </div>
    </motion.div>
  );
};

export default InstructorCard;
