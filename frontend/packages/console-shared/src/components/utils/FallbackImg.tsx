import type { ReactNode, ImgHTMLAttributes, FC } from 'react';
import { useState } from 'react';

type FallbackImgProps = {
  src: string;
  alt: string;
  fallback?: ReactNode;
} & ImgHTMLAttributes<HTMLImageElement>;

const FallbackImg: FC<FallbackImgProps> = ({ src, alt, fallback, ...props }) => {
  const [isSrcValid, setIsSrcValid] = useState<boolean>(true);

  if (src && isSrcValid) {
    return <img {...props} src={src} alt={alt} onError={() => setIsSrcValid(false)} />;
  }

  return <>{fallback}</>;
};

export default FallbackImg;
