import * as React from 'react';

type FallbackImgProps = {
  src: string;
  alt: string;
  fallback?: React.ReactNode;
} & React.ImgHTMLAttributes<HTMLImageElement>;

const FallbackImg: React.FC<FallbackImgProps> = ({ src, alt, fallback, ...props }) => {
  const [isSrcValid, setIsSrcValid] = React.useState<boolean>(true);

  if (src && isSrcValid) {
    return <img {...props} src={src} alt={alt} onError={() => setIsSrcValid(false)} />;
  }

  return <>{fallback}</>;
};

export default FallbackImg;
