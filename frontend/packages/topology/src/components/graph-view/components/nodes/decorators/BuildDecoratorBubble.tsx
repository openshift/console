import type { ComponentProps, ReactNode, FC } from 'react';
import Decorator from './Decorator';

type BuildDecoratorBubbleProps = ComponentProps<typeof Decorator> & {
  children: ReactNode;
  radius: number;
  x: number;
  y: number;
};

const BuildDecoratorBubble: FC<BuildDecoratorBubbleProps> = ({
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
