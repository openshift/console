import * as React from 'react';

type FallbackImgProps = {
  src: string;
  alt?: string;
  className?: string;
  fallback?: React.ReactNode;
};

const FallbackImg: React.FC<FallbackImgProps> = ({ src, alt, className, fallback }) => {
  const [isSrcValid, setIsSrcValid] = React.useState<boolean>(true);

  if (src && isSrcValid)
    return <img className={className} src={src} alt={alt} onError={() => setIsSrcValid(false)} />;

  return <>{fallback}</>;
};

export default FallbackImg;
