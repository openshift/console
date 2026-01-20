import type { FC, ReactNode, CSSProperties } from 'react';
import { useState, useRef, useEffect } from 'react';
import { Popover } from '@patternfly/react-core';
import { useDebounceCallback } from '../../hooks/debounce';
import './ClampedText.scss';

type ClampedTextProps = {
  children: ReactNode;
  lineClamp?: number;
};

const ClampedText: FC<ClampedTextProps> = ({ children, lineClamp = 1 }) => {
  const [isContentClamped, setContentClamped] = useState<boolean>(false);
  const measureRef = useRef<HTMLDivElement>(null);
  const debouncedSetContentClamped = useDebounceCallback(() => {
    setContentClamped(measureRef.current.scrollHeight > measureRef.current.clientHeight);
  });
  const style = { '--ocs-clamped-text--line-clamp': lineClamp } as CSSProperties;

  useEffect(() => {
    debouncedSetContentClamped();
  }, [children, lineClamp, debouncedSetContentClamped]);

  return (
    <div ref={measureRef} className="ocs-clamped-text" style={style}>
      {isContentClamped ? (
        <Popover bodyContent={children}>
          <div tabIndex={0} role="button">
            {children}
          </div>
        </Popover>
      ) : (
        <>{children}</>
      )}
    </div>
  );
};

export default ClampedText;
