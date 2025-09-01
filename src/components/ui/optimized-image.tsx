import React, { useState, useEffect, useCallback } from 'react';
import { Skeleton } from './skeleton';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  lowQualitySrc?: string;
  className?: string;
  skeletonClassName?: string;
}

export function OptimizedImage({ 
  src, 
  alt, 
  lowQualitySrc, 
  className = '', 
  skeletonClassName = '',
  ...props 
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const { isSlowConnection, isOnline } = useNetworkStatus();

  // Preload image to ensure it loads properly
  const preloadImage = useCallback((url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Handle CORS for external images
      img.onload = () => {
        setImageElement(img);
        resolve();
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = url;
    });
  }, []);

  useEffect(() => {
    if (!isOnline) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    // Use low quality image for slow connections
    const sourceToUse = (isSlowConnection && lowQualitySrc) ? lowQualitySrc : src;
    
    // Preload the image first
    preloadImage(sourceToUse)
      .then(() => {
        setImageSrc(sourceToUse);
        setIsLoading(false);
      })
      .catch(() => {
        // If primary image fails and we have a fallback, try that
        if (lowQualitySrc && sourceToUse !== lowQualitySrc) {
          preloadImage(lowQualitySrc)
            .then(() => {
              setImageSrc(lowQualitySrc);
              setIsLoading(false);
            })
            .catch(() => {
              setHasError(true);
              setIsLoading(false);
            });
        } else {
          setHasError(true);
          setIsLoading(false);
        }
      });
  }, [src, lowQualitySrc, isSlowConnection, isOnline, preloadImage]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    // Try fallback image if available
    if (lowQualitySrc && imageSrc !== lowQualitySrc) {
      setImageSrc(lowQualitySrc);
    } else {
      setIsLoading(false);
      setHasError(true);
    }
  };

  if (hasError || !isOnline) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        <span className="text-sm text-muted-foreground">
          {!isOnline ? 'Offline' : 'Image failed to load'}
        </span>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && <Skeleton className={`absolute inset-0 ${skeletonClassName}`} />}
      <img
        src={imageSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        {...props}
      />
    </div>
  );
}