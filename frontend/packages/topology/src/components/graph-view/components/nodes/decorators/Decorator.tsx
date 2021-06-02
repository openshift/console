import * as React from 'react';
import { Link } from 'react-router-dom';
import { createSvgIdUrl, useHover } from '@patternfly/react-topology';
import SvgDropShadowFilter from '../../../../svg/SvgDropShadowFilter';

import './Decorator.scss';

type DecoratorTypes = {
  x: number;
  y: number;
  radius: number;
  onClick?(event: React.MouseEvent<SVGGElement, MouseEvent>): void;
  href?: string;
  ariaLabel?: string;
  external?: boolean;
  circleRef?: React.Ref<SVGCircleElement>;
};

const FILTER_ID = 'DecoratorDropShadowFilterId';
const HOVER_FILTER_ID = 'DecoratorDropShadowHoverFilterId';

const Decorator: React.FunctionComponent<DecoratorTypes> = ({
  x,
  y,
  radius,
  children,
  onClick,
  href,
  ariaLabel,
  external,
  circleRef,
}) => {
  const [hover, hoverRef] = useHover();
  const decorator = (
    <g
      ref={hoverRef}
      className="odc-decorator"
      {...(onClick
        ? {
            onClick: (e) => {
              e.stopPropagation();
              onClick(e);
            },
          }
        : null)}
      {...(!href
        ? {
            role: 'button',
            'aria-label': ariaLabel,
          }
        : null)}
    >
      <SvgDropShadowFilter id={FILTER_ID} stdDeviation={1} floodOpacity={0.5} />
      <SvgDropShadowFilter id={HOVER_FILTER_ID} dy={3} stdDeviation={5} floodOpacity={0.5} />
      <circle
        key={hover ? 'circle-hover' : 'circle'}
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
    return external ? (
      /*
      // @ts-ignore */
      // eslint-disable-next-line jsx-a11y/anchor-is-valid
      <a
        className="odc-decorator__link"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          e.stopPropagation();
        }}
        role="button"
        aria-label={ariaLabel}
      >
        {decorator}
      </a>
    ) : (
      <Link className="odc-decorator__link" to={href} role="button" aria-label={ariaLabel}>
        {decorator}
      </Link>
    );
  }
  return decorator;
};

export default Decorator;
