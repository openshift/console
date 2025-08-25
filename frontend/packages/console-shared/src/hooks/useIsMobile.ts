import { useState, useEffect } from 'react';

const MAX_MOBILE_WIDTH = 767;
const MOBILE_MEDIA_QUERY = `(max-width: ${MAX_MOBILE_WIDTH}px)`;

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= MAX_MOBILE_WIDTH);

  useEffect(() => {
    const mobileResolutionMatch = window.matchMedia(MOBILE_MEDIA_QUERY);

    const updateIsMobile = (e) => {
      setIsMobile(e.matches);
    };

    // support safari with fallback to addListener / removeListener
    if (mobileResolutionMatch.addEventListener) {
      mobileResolutionMatch.addEventListener('change', updateIsMobile);
    } else {
      mobileResolutionMatch.addListener(updateIsMobile);
    }

    // Remove event listener on cleanup
    return () => {
      if (mobileResolutionMatch.removeEventListener) {
        mobileResolutionMatch.removeEventListener('change', updateIsMobile);
      } else {
        mobileResolutionMatch.removeListener(updateIsMobile);
      }
    };
  }, []); // Empty array ensures that effect is only run on mount

  return isMobile;
};
