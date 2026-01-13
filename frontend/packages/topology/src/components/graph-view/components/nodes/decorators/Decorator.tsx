import { FC, ReactNode, Ref, MouseEvent as ReactMouseEvent } from 'react';
import { Decorator as PfDecorator } from '@patternfly/react-topology';
import { Link } from 'react-router-dom-v5-compat';

import './Decorator.scss';

type DecoratorTypes = {
  x: number;
  y: number;
  radius: number;
  onClick?(event: ReactMouseEvent<SVGGElement, MouseEvent>): void;
  href?: string;
  ariaLabel?: string;
  external?: boolean;
  circleRef?: Ref<SVGCircleElement>;
  children?: ReactNode;
};

const Decorator: FC<DecoratorTypes> = ({
  x,
  y,
  radius,
  href,
  ariaLabel,
  external,
  children,
  ...rest
}) => {
  const decorator = (
    <PfDecorator x={x} y={y} radius={radius} className="odc-decorator" showBackground {...rest}>
      {children}
    </PfDecorator>
  );

  if (href) {
    return external ? (
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
