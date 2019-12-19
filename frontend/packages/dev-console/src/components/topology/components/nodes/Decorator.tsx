import * as React from 'react';
import { createSvgIdUrl } from '@console/topology';
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
  const decorator = (
    <g
      className="odc-decorator"
      onClick={(e) => {
        e.stopPropagation();
        onClick && onClick(e);
      }}
    >
      <SvgDropShadowFilter id={FILTER_ID} stdDeviation={1} floodOpacity={0.5} />
      <circle
        ref={circleRef}
        className="odc-decorator__bg"
        cx={x}
        cy={y}
        r={radius}
        filter={createSvgIdUrl(FILTER_ID)}
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

export default Decorator;
