import * as React from 'react';
import Measure from 'react-measure';
import { Popover } from '@patternfly/react-core';
import { useDebounceCallback } from '../../hooks';
import './ClampedText.scss';

type ClampedTextProps = {
  children: React.ReactNode;
  lineClamp?: number;
};

const ClampedText: React.FC<ClampedTextProps> = ({ children, lineClamp = 1 }) => {
  const [isContentClamped, setContentClamped] = React.useState<boolean>(false);
  const debouncedSetContentClamped = useDebounceCallback(
    ({ scroll: { height: scrollHeight }, offset: { height: offsetHeight } }) =>
      setContentClamped(scrollHeight > offsetHeight),
    [setContentClamped],
  );
  const style = { '--ocs-clamped-text--line-clamp': lineClamp } as React.CSSProperties;

  return (
    <Measure offset scroll onResize={debouncedSetContentClamped}>
      {({ measureRef }) => (
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
      )}
    </Measure>
  );
};

export default ClampedText;
