'use client';

import React from 'react';
import { Users, BookOpen, Award, Globe, Target, Heart, Zap } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';

const AboutPage: React.FC = () => {
  const stats = [
    { icon: Users, label: 'Students Worldwide', value: '50,000+' },
    { icon: BookOpen, label: 'Courses Available', value: '1,200+' },
    { icon: Award, label: 'Expert Instructors', value: '500+' },
    { icon: Globe, label: 'Countries Reached', value: '100+' }
  ];

  const values = [
    {
      icon: Target,
      title: 'Excellence',
      description: 'We strive for excellence in everything we do, from course content to student support.'
    },
    {
      icon: Heart,
      title: 'Passion',
      description: 'We are passionate about education and helping people achieve their learning goals.'
    },
    {
      icon: Zap,
      title: 'Innovation',
      description: 'We embrace new technologies and innovative teaching methods to enhance learning.'
    }
  ];

  const team = [
    {
      name: 'John Smith',
      role: 'CEO & Founder',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300',
      bio: 'Former tech executive with 15+ years in education technology.'
    },
    {
      name: 'Sarah Johnson',
      role: 'Head of Education',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300',
      bio: 'PhD in Education with expertise in online learning methodologies.'
    },
    {
      name: 'Mike Chen',
      role: 'CTO',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
      bio: 'Software engineer passionate about building scalable learning platforms.'
    },
    {
      name: 'Emily Davis',
      role: 'Head of Content',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300',
      bio: 'Content strategist with experience in curriculum development.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6">About Course Management</h1>
          <p className="text-xl max-w-3xl mx-auto">
            We're on a mission to democratize education and make high-quality learning 
            accessible to everyone, everywhere.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="h-8 w-8 text-primary-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-6">
                At Course Management, we believe that education is the key to unlocking human potential. 
                Our mission is to provide world-class online education that is accessible, affordable, 
                and effective for learners around the globe.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                We partner with industry experts and leading institutions to create courses that are 
                not only educational but also practical and relevant to today's job market.
              </p>
              <p className="text-lg text-gray-600">
                Whether you're looking to advance your career, learn a new skill, or pursue a passion, 
                we're here to support your learning journey every step of the way.
              </p>
            </div>
            <div>
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600"
                alt="Students learning"
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              These core values guide everything we do and shape the way we serve our community.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center">
                <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <value.icon className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our diverse team of educators, technologists, and innovators is dedicated to 
              creating the best learning experience possible.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-6 text-center">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{member.name}</h3>
                <p className="text-primary-600 font-medium mb-3">{member.role}</p>
                <p className="text-gray-600 text-sm">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <img
                src="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600"
                alt="Our story"
                className="rounded-lg shadow-lg"
              />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
              <p className="text-lg text-gray-600 mb-6">
                Course Management was founded in 2020 with a simple idea: make quality education 
                accessible to everyone. What started as a small team of passionate educators has 
                grown into a global platform serving students worldwide.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                We've come a long way since our early days, but our commitment to educational 
                excellence remains unchanged. Every course, every feature, and every interaction 
                is designed with our learners in mind.
              </p>
              <p className="text-lg text-gray-600">
                Today, we're proud to be a trusted partner in the learning journeys of thousands 
                of students, helping them achieve their goals and transform their lives through education.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Learning?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join our community of learners and start your educational journey today.
          </p>
          <div className="flex justify-center space-x-4">
            <a
              href="/courses"
              className="bg-white text-primary-600 px-8 py-3 rounded-md font-medium hover:bg-gray-100 transition-colors"
            >
              Browse Courses
            </a>
            <a
              href="/auth/register"
              className="border-2 border-white text-white px-8 py-3 rounded-md font-medium hover:bg-white hover:text-primary-600 transition-colors"
            >
              Sign Up Free
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
