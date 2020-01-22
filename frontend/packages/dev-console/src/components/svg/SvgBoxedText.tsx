import * as React from 'react';
import {
  useSize,
  useHover,
  WithDndDragProps,
  useCombineRefs,
  createSvgIdUrl,
} from '@console/topology';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import SvgResourceIcon from '../topology/components/nodes/ResourceIcon';
import SvgDropShadowFilter from './SvgDropShadowFilter';

export interface SvgBoxedTextProps {
  children?: string;
  className?: string;
  paddingX?: number;
  paddingY?: number;
  x?: number;
  y?: number;
  cornerRadius?: number;
  kind?: string;
  truncate?: number;
  dragRef?: WithDndDragProps['dndDragRef'];
  icon?: string;
  // TODO remove with 2.0
  onMouseEnter?: React.MouseEventHandler<SVGGElement>;
  onMouseLeave?: React.MouseEventHandler<SVGGElement>;
}

const FILTER_ID = 'SvgBoxedTextDropShadowFilterId';
const iconFilterID = 'SVGBoxedTextRectIconFilter';
const iconSize = 36;
const iconPadding = 3;

const truncateEnd = (text: string = '', length: number): string => {
  if (text.length <= length) {
    return text;
  }
  return `${text.substr(0, length - 1)}…`;
};

/**
 * Renders a `<text>` component with a `<rect>` box behind.
 */
const SvgBoxedText: React.FC<SvgBoxedTextProps> = ({
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
  truncate,
  dragRef,
  icon,
  ...other
}) => {
  const [labelHover, labelHoverRef] = useHover();
  const [textSize, textRef] = useSize([children, className, labelHover]);
  const [badgeSize, badgeRef] = useSize([kind]);
  const [labelSize, labelRef] = useSize([children, textSize, badgeSize]);
  const iconSpace = kind && badgeSize ? badgeSize.width + paddingX : 0;
  const labelSizeWidth = icon ? paddingX * 2 + iconSpace + iconSize / 2 : paddingX * 2 + iconSpace;
  const refs = useCombineRefs(dragRef, typeof truncate === 'number' ? labelHoverRef : undefined);
  return (
    <g className={className} ref={refs}>
      <SvgDropShadowFilter id={FILTER_ID} />
      {textSize && (
        <rect
          ref={labelRef}
          filter={createSvgIdUrl(FILTER_ID)}
          x={x - paddingX - textSize.width / 2 - iconSpace / 2}
          width={textSize.width + labelSizeWidth}
          y={y - paddingY - textSize.height / 2}
          height={textSize.height + paddingY * 2}
          rx={cornerRadius}
          ry={cornerRadius}
        />
      )}
      {textSize && kind && (
        <SvgResourceIcon
          ref={badgeRef}
          x={x - textSize.width / 2 - paddingX / 2}
          y={y}
          kind={kind}
        />
      )}

      <text
        {...other}
        ref={textRef}
        x={x + iconSpace / 2}
        y={y}
        textAnchor="middle"
        dy="0.35em"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {typeof truncate === 'number'
          ? labelHover
            ? children
            : truncateEnd(children, truncate)
          : children}
      </text>
      {icon && textSize && badgeSize && labelSize && (
        <>
          <SvgDropShadowFilter id={iconFilterID} />
          <rect
            x={x + labelSize.width / 2 + paddingX - iconSize / 2}
            y={y}
            width={iconSize}
            height={iconSize}
            fill="#fff"
            rx={cornerRadius}
            ry={cornerRadius}
            filter={createSvgIdUrl(iconFilterID)}
          />
          <image
            x={x + labelSize.width / 2 + paddingX - iconSize / 2 + iconPadding}
            y={y + iconPadding}
            width={30}
            height={30}
            xlinkHref={getImageForIconClass(`icon-${icon}`)}
          />
        </>
      )}
    </g>
  );
};

export default SvgBoxedText;
