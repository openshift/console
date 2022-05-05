import * as React from 'react';
import { Decorator as PfDecorator } from '@patternfly/react-topology';
import { Link } from 'react-router-dom';

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

const Decorator: React.FunctionComponent<DecoratorTypes> = ({
  x,
  y,
  radius,
  href,
  ariaLabel,
  external,
  ...rest
}) => {
  const decorator = (
    <PfDecorator x={x} y={y} radius={radius} className="odc-decorator" showBackground {...rest} />
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
