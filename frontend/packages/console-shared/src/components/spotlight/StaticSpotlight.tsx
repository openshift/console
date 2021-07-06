import * as React from 'react';
import { useBoundingClientRect } from '../../hooks';
import Portal from '../popper/Portal';
import './spotlight.scss';

type StaticSpotlightProps = {
  element: Element | HTMLElement;
};

const StaticSpotlight: React.FC<StaticSpotlightProps> = ({ element }) => {
  const clientRect = useBoundingClientRect(element as HTMLElement);
  const style: React.CSSProperties = clientRect
    ? {
        top: clientRect.top,
        left: clientRect.left,
        height: clientRect.height,
        width: clientRect.width,
      }
    : {};
  return clientRect ? (
    <Portal>
      <div className="pf-c-backdrop">
        <div className="ocs-spotlight ocs-spotlight__element-highlight-noanimate" style={style} />
      </div>
    </Portal>
  ) : null;
};

export default StaticSpotlight;
