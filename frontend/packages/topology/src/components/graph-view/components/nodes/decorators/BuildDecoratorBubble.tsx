import * as React from 'react';
import Decorator from './Decorator';

type BuildDecoratorBubbleProps = React.ComponentProps<typeof Decorator> & {
  children: React.ReactNode;
  radius: number;
  x: number;
  y: number;
};

const BuildDecoratorBubble: React.FC<BuildDecoratorBubbleProps> = ({
  children,
  radius,
  x,
  y,
  ...otherDecoratorProps
}) => (
  <Decorator x={x} y={y} radius={radius} {...otherDecoratorProps}>
    <g transform={`translate(-${radius / 2}, -${radius / 2})`}>
      <foreignObject width={radius} height={radius} style={{ fontSize: radius }}>
        {children}
      </foreignObject>
    </g>
  </Decorator>
);

export default BuildDecoratorBubble;
