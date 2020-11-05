import * as React from 'react';
import Portal from '../popper/Portal';
import './spotlight.scss';

type StaticSpotlightProps = {
  element: Element;
};

const StaticSpotlight: React.FC<StaticSpotlightProps> = ({ element }) => {
  const { top, left, height, width } = element.getBoundingClientRect();
  const style: React.CSSProperties = {
    top,
    left,
    height,
    width,
  };
  return (
    <Portal>
      <div className="pf-c-backdrop ocs-spotlight__with-backdrop">
        <div className="ocs-spotlight ocs-spotlight__element-highlight-noanimate" style={style} />
      </div>
    </Portal>
  );
};

export default StaticSpotlight;
