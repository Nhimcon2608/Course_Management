'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
}

interface FloatingParticlesProps {
  count?: number;
  className?: string;
}

const FloatingParticles: React.FC<FloatingParticlesProps> = ({
  count = 50,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!containerRef.current || !isClient) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();

    // Initialize particles
    particlesRef.current = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * rect.width,
      y: Math.random() * rect.height,
      size: Math.random() * 4 + 1,
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: (Math.random() - 0.5) * 0.5,
      opacity: Math.random() * 0.5 + 0.1,
    }));

    const animate = () => {
      const rect = container.getBoundingClientRect();
      
      particlesRef.current.forEach(particle => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // Wrap around edges
        if (particle.x > rect.width) particle.x = 0;
        if (particle.x < 0) particle.x = rect.width;
        if (particle.y > rect.height) particle.y = 0;
        if (particle.y < 0) particle.y = rect.height;
      });

      // Update DOM
      const particleElements = container.querySelectorAll('.particle');
      particleElements.forEach((element, index) => {
        const particle = particlesRef.current[index];
        if (particle && element instanceof HTMLElement) {
          element.style.transform = `translate(${particle.x}px, ${particle.y}px)`;
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [count]);

  if (!isClient) {
    return <div ref={containerRef} className={`absolute inset-0 overflow-hidden ${className}`} />;
  }

  return (
    <div ref={containerRef} className={`absolute inset-0 overflow-hidden ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="particle absolute rounded-full bg-white pointer-events-none"
          style={{
            width: `${Math.random() * 4 + 1}px`,
            height: `${Math.random() * 4 + 1}px`,
            opacity: Math.random() * 0.3 + 0.1,
          }}
        />
      ))}
    </div>
  );
};

export default FloatingParticles;
