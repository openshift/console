import * as React from 'react';
import { createSvgIdUrl, useHover } from '@console/topology';
import SvgDropShadowFilter from '../../../svg/SvgDropShadowFilter';

import './Decorator.scss';

type DecoratorTypes = {
  x: number;
  y: number;
  radius: number;
  onClick?(event: React.MouseEvent<SVGGElement, MouseEvent>): void;
  href?: string;
  external?: boolean;
  circleRef?: React.Ref<SVGCircleElement>;
};

const FILTER_ID = 'DecoratorDropShadowFilterId';
const HOVER_FILTER_ID = 'DecoratorDropShadowHoverFilterId';

const Decorator: React.FunctionComponent<DecoratorTypes> = ({
  x,
  y,
  radius,
  onClick,
  children,
  href,
  external,
  circleRef,
}) => {
  const [hover, hoverRef] = useHover();
  const decorator = (
    <g
      className="odc-decorator"
      onClick={(e) => {
        e.stopPropagation();
        onClick && onClick(e);
      }}
      ref={hoverRef}
    >
      <SvgDropShadowFilter id={FILTER_ID} stdDeviation={1} floodOpacity={0.5} />
      <SvgDropShadowFilter id={HOVER_FILTER_ID} dy={3} stdDeviation={5} floodOpacity={0.5} />
      <circle
        ref={circleRef}
        className="odc-decorator__bg"
        cx={x}
        cy={y}
        r={radius}
        filter={createSvgIdUrl(hover ? HOVER_FILTER_ID : FILTER_ID)}
      />
      <g transform={`translate(${x}, ${y})`}>{children}</g>
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

export { Decorator };
