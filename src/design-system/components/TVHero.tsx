import React from 'react';
import { LazyImage } from '../../components/LazyImage';

interface TVHeroProps {
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl: string;
  logoUrl?: string;
  actions?: React.ReactNode; // e.g. TVButton components
  className?: string;
}

export const TVHero: React.FC<TVHeroProps> = ({
  title,
  subtitle,
  description,
  imageUrl,
  logoUrl,
  actions,
  className = '',
}) => {
  return (
    <div className={`relative w-full h-[70vh] min-h-[600px] flex items-end ${className}`}>
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <LazyImage
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover"
        />
        {/* Gradients to blend into the background */}
        <div className="absolute inset-0 bg-gradient-to-r from-tv-bg via-tv-bg/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-tv-bg via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 px-tv-safe-h pb-tv-safe-v max-w-[50%] flex flex-col gap-6">
        {logoUrl ? (
          <img src={logoUrl} alt={title} className="max-h-[120px] object-contain object-left mb-4" />
        ) : (
          <h1 className="text-tv-hero font-black text-white leading-tight drop-shadow-lg">
            {title}
          </h1>
        )}

        {subtitle && (
          <p className="text-tv-title text-tv-primary font-bold drop-shadow-md">
            {subtitle}
          </p>
        )}

        {description && (
          <p className="text-tv-body text-tv-text-secondary line-clamp-3 leading-relaxed drop-shadow-md">
            {description}
          </p>
        )}

        {actions && (
          <div className="flex items-center gap-4 mt-4">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
