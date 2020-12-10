import * as React from 'react';

const MAX_MOBILE_WIDTH = 767;
const MOBILE_MEDIA_QUERY = `(max-width: ${MAX_MOBILE_WIDTH}px)`;

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = React.useState<boolean>(window.innerWidth <= MAX_MOBILE_WIDTH);

  React.useEffect(() => {
    const mobileResolutionMatch = window.matchMedia(MOBILE_MEDIA_QUERY);

    const updateIsMobile = (e) => {
      setIsMobile(e.matches);
    };

    mobileResolutionMatch.addEventListener('change', updateIsMobile);

    // Remove event listener on cleanup
    return () => mobileResolutionMatch.removeEventListener('change', updateIsMobile);
  }, []); // Empty array ensures that effect is only run on mount

  return isMobile;
};
