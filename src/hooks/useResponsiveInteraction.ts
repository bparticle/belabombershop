import { useState, useEffect, useCallback } from 'react';
import { useClientOnly } from './useClientOnly';

interface UseResponsiveInteractionOptions {
  onDesktopHover?: () => void;
  onDesktopLeave?: () => void;
  onMobileToggle?: () => void;
}

interface UseResponsiveInteractionReturn {
  isHovering: boolean;
  isMobileExpanded: boolean;
  isMobile: boolean;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
  handleCardClick: (e: React.MouseEvent) => void;
}

export const useResponsiveInteraction = (
  options: UseResponsiveInteractionOptions = {}
): UseResponsiveInteractionReturn => {
  const [isHovering, setIsHovering] = useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const isClient = useClientOnly();

  // Check if device is mobile on mount and resize
  useEffect(() => {
    if (!isClient) return;
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [isClient]);

  // Handle hover for desktop
  const handleMouseEnter = useCallback(() => {
    if (!isMobile) {
      setIsHovering(true);
      options.onDesktopHover?.();
    }
  }, [isMobile, options.onDesktopHover]);

  const handleMouseLeave = useCallback(() => {
    if (!isMobile) {
      setIsHovering(false);
      setIsMobileExpanded(false);
      options.onDesktopLeave?.();
    }
  }, [isMobile, options.onDesktopLeave]);

  // Handle click for mobile
  const handleCardClick = useCallback((e: React.MouseEvent) => {
    if (isMobile) {
      e.preventDefault();
      setIsMobileExpanded(!isMobileExpanded);
      options.onMobileToggle?.();
    }
  }, [isMobile, isMobileExpanded, options.onMobileToggle]);

  return {
    isHovering,
    isMobileExpanded,
    isMobile,
    handleMouseEnter,
    handleMouseLeave,
    handleCardClick,
  };
};
