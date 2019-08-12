import * as React from 'react';
import { TooltipPosition } from '@patternfly/react-core';
import SvgDropShadowFilter from '../../svg/SvgDropShadowFilter';
import { createSvgIdUrl } from '../../../utils/svg-utils';
import DecoratorTooltip from '../SvgDecoratorTooltip';

import './Decorator.scss';

type DecoratorTypes = {
  x: number;
  y: number;
  radius: number;
  onClick?(): void;
  href?: string;
  external?: boolean;
  title: string;
  position?: TooltipPosition;
};

const FILTER_ID = 'DecoratorDropShadowFilterId';

const Decorator: React.FunctionComponent<DecoratorTypes> = ({
  x,
  y,
  radius,
  onClick,
  children,
  href,
  external,
  title,
  position = TooltipPosition.top,
}) => {
  const [hover, setHover] = React.useState(false);

  const decorator = (
    <g
      className="odc-decorator"
      transform={`translate(${x}, ${y})`}
      onClick={(e) => {
        e.stopPropagation();
        onClick && onClick();
      }}
    >
      <g onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
        <SvgDropShadowFilter id={FILTER_ID} stdDeviation={1} floodOpacity={0.5} />
        <circle
          className="odc-decorator__bg"
          cx={0}
          cy={0}
          r={radius}
          filter={createSvgIdUrl(FILTER_ID)}
        />
        {children}
      </g>
      <DecoratorTooltip
        title={title}
        x={0}
        y={0}
        radius={radius}
        position={position}
        active={hover}
      />
    </g>
  );
  if (href) {
    return (
      /*
      // @ts-ignore */
      // eslint-disable-next-line jsx-a11y/anchor-is-valid
      <a className="odc-decorator__link" xlinkHref={href} target={external ? '_blank' : null}>
        {decorator}
      </a>
    );
  }
  return decorator;
};

export default Decorator;
