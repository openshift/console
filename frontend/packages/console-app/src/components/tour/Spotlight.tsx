import * as React from 'react';
import Portal from '@console/shared/src/components/popper/Portal';
import './Spotlight.scss';

type SpotlightProps = {
  selector: string;
};

export const Spotlight: React.FC<SpotlightProps> = ({ selector }) => {
  const element = document.querySelector(selector);
  const { height, width, top, left } = element.getBoundingClientRect();
  const style: React.CSSProperties = {
    top,
    left,
    height,
    width,
  };
  return (
    <Portal>
      <div className="pf-c-backdrop co-tour-spotlight">
        <div className="co-tour-spotlight__element-hightlight" style={style} />
      </div>
    </Portal>
  );
};
