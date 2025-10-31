import * as React from 'react';
import { Popover } from '@patternfly/react-core';
import { useDebounceCallback } from '../../hooks';
import './ClampedText.scss';

type ClampedTextProps = {
  children: React.ReactNode;
  lineClamp?: number;
};

const ClampedText: React.FC<ClampedTextProps> = ({ children, lineClamp = 1 }) => {
  const [isContentClamped, setContentClamped] = React.useState<boolean>(false);
  const measureRef = React.useRef<HTMLDivElement>(null);
  const debouncedSetContentClamped = useDebounceCallback(() => {
    setContentClamped(measureRef.current.scrollHeight > measureRef.current.clientHeight);
  });
  const style = { '--ocs-clamped-text--line-clamp': lineClamp } as React.CSSProperties;

  React.useEffect(() => {
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
