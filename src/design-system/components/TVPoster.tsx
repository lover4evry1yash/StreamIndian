import React from 'react';
import { FocusItem } from '../../components/FocusItem';
import { LazyImage } from '../../components/LazyImage';

interface TVPosterProps {
  id: string;
  groupId?: string;
  imageUrl: string;
  title: string;
  subtitle?: string;
  onClick: () => void;
  aspectRatio?: 'poster' | 'backdrop' | 'square';
  className?: string;
}

export const TVPoster: React.FC<TVPosterProps> = ({
  id,
  groupId,
  imageUrl,
  title,
  subtitle,
  onClick,
  aspectRatio = 'poster',
  className = '',
}) => {
  const aspectClasses = {
    poster: 'aspect-[2/3]',
    backdrop: 'aspect-[16/9]',
    square: 'aspect-square'
  };

  return (
    <FocusItem
      id={id}
      groupId={groupId}
      onClick={onClick}
      className={(isFocused) => `flex flex-col gap-3 ${className}`}
      focusedClassName="scale-[1.05] z-20"
      unfocusedClassName="scale-100 opacity-90"
    >
      {(isFocused) => (
        <>
          <div className={`w-full relative rounded-[0.75rem] overflow-hidden shadow-tv-card transition-all duration-300 ${isFocused ? 'ring-[4px] ring-white shadow-[0_10px_40px_rgba(0,0,0,0.8)]' : 'ring-0 ring-transparent'} ${aspectClasses[aspectRatio]}`}>
            <LazyImage
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover"
              priority={isFocused ? 'high' : 'low'}
            />
            <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 ${isFocused ? 'opacity-100' : 'opacity-0'}`} />
          </div>
          
          <div className="flex flex-col px-1">
            <h3 className={`text-tv-body font-bold truncate transition-colors ${isFocused ? 'text-white' : 'text-tv-text-primary'}`}>
              {title}
            </h3>
            {subtitle && (
              <p className={`text-tv-sm truncate transition-colors ${isFocused ? 'text-[#d4d4d8]' : 'text-tv-text-secondary'}`}>
                {subtitle}
              </p>
            )}
          </div>
        </>
      )}
    </FocusItem>
  );
};
