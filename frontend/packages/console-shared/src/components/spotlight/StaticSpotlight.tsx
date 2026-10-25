import type { FC, CSSProperties } from 'react';
import * as ReactDOM from 'react-dom';
import { useBoundingClientRect } from '../../hooks/useBoundingClientRect';
import './spotlight.scss';

type StaticSpotlightProps = {
  element: Element | HTMLElement;
};

const StaticSpotlight: FC<StaticSpotlightProps> = ({ element }) => {
  const clientRect = useBoundingClientRect(element as HTMLElement);
  const style: CSSProperties = clientRect
    ? {
        top: clientRect.top,
        left: clientRect.left,
        height: clientRect.height,
        width: clientRect.width,
      }
    : {};
  return clientRect
    ? ReactDOM.createPortal(
        <div className="pf-v6-c-backdrop ocs-spotlight__with-backdrop">
          <div className="ocs-spotlight ocs-spotlight__element-highlight-noanimate" style={style} />
        </div>,
        document.body,
      )
    : null;
};

export default StaticSpotlight;
