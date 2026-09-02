'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text = 'Loading...',
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-12 h-12 border-4',
    lg: 'w-16 h-16 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4" role="status">
      <div
        className={`${sizeClasses[size]} motion-reduce:animate-none animate-spin rounded-full border-border border-t-cta-start`}
        aria-hidden="true"
      />
      {text && <p className="text-sm font-medium text-muted-foreground">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
