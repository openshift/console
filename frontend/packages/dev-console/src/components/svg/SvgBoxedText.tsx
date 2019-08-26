import * as React from 'react';
import { createSvgIdUrl } from '../../utils/svg-utils';
import SvgResourceIcon from '../topology/shapes/ResourceIcon';
import SvgDropShadowFilter from './SvgDropShadowFilter';

export interface State {
  bb?: { width: number; height: number };
}

export interface SvgBoxedTextProps {
  children?: string;
  className?: string;
  paddingX?: number;
  paddingY?: number;
  x?: number;
  y?: number;
  cornerRadius?: number;
  kind?: string;
  onMouseEnter?: React.MouseEventHandler<SVGGElement>;
  onMouseLeave?: React.MouseEventHandler<SVGGElement>;
}

const FILTER_ID = 'SvgBoxedTextDropShadowFilterId';

/**
 * Renders a `<text>` component with a `<rect>` box behind.
 */
const SvgBoxedText: React.FC<SvgBoxedTextProps> = (props) => {
  const textRef = React.useRef<SVGTextElement>();
  const iconRef = React.useRef<any>();
  const [bb, setBb] = React.useState();

  const {
    children,
    className,
    paddingX = 0,
    paddingY = 0,
    cornerRadius = 4,
    x = 0,
    y = 0,
    kind,
    onMouseEnter,
    onMouseLeave,
    ...other
  } = props;

  const iconSpace: number =
    kind && iconRef.current ? iconRef.current.getBBox().width + paddingX : 0;

  React.useEffect(() => {
    const { current } = textRef;
    if (current && current.getBBox) {
      setBb(current.getBBox());
    }
  }, [children, className, textRef]);

  return (
    <g className={className} onClick={(e) => e.stopPropagation()}>
      <SvgDropShadowFilter id={FILTER_ID} />
      {bb && (
        <rect
          filter={createSvgIdUrl(FILTER_ID)}
          x={x - paddingX - bb.width / 2 - iconSpace / 2}
          width={bb.width + paddingX * 2 + iconSpace}
          y={y - paddingY - bb.height / 2}
          height={bb.height + paddingY * 2}
          rx={cornerRadius}
          ry={cornerRadius}
        />
      )}
      {bb && kind && (
        <SvgResourceIcon ref={iconRef} x={x - bb.width / 2 - paddingX / 2} y={y} kind={kind} />
      )}
      <text
        ref={textRef}
        {...other}
        x={x + iconSpace / 2}
        y={y}
        textAnchor="middle"
        dy="0.35em"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {children}
      </text>
    </g>
  );
};

export default SvgBoxedText;
