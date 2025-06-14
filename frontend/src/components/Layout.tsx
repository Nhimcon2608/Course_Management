import React from 'react';
import Navbar from '@/components/layout/Navbar';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, className = '' }) => {
  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      <Navbar />
      <main>
        {children}
      </main>
    </div>
  );
};

export default Layout;
