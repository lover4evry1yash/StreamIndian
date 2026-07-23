import React from 'react';

export const SkeletonBox: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white/5 rounded-xl ${className}`} />
);

export const SkeletonText: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white/10 rounded-md ${className}`} />
);

export const SkeletonPoster: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white/5 rounded-xl aspect-[2/3] ${className}`} />
);

export const SkeletonBackdrop: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white/5 rounded-xl aspect-video ${className}`} />
);

export const SkeletonMediaRow: React.FC<{ count?: number, className?: string }> = ({ count = 5, className = '' }) => (
  <div className={`flex gap-4 overflow-hidden ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonPoster key={i} className="w-32 md:w-48 flex-shrink-0" />
    ))}
  </div>
);

export const SkeletonDetails: React.FC = () => (
  <div className="flex flex-col md:flex-row gap-8 p-12 w-full h-full">
    <div className="w-full md:w-2/3 flex flex-col gap-6">
      <SkeletonText className="w-3/4 h-12" />
      <div className="flex gap-4">
        <SkeletonText className="w-16 h-6" />
        <SkeletonText className="w-24 h-6" />
        <SkeletonText className="w-20 h-6" />
      </div>
      <SkeletonText className="w-full h-32" />
      <div className="flex gap-4 mt-4">
        <SkeletonBox className="w-40 h-12 rounded-2xl" />
        <SkeletonBox className="w-40 h-12 rounded-2xl" />
      </div>
    </div>
    <div className="hidden md:block md:w-1/3">
      <SkeletonPoster className="w-2/3 ml-auto shadow-xl" />
    </div>
  </div>
);
