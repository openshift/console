import * as React from 'react';
import * as classNames from 'classnames';
import {
  Node,
  useAnchor,
  EllipseAnchor,
  WithCreateConnectorProps,
  WithDndDropProps,
  WithDragNodeProps,
  WithSelectionProps,
  WithContextMenuProps,
  useCombineRefs,
  useHover,
  observer,
  createSvgIdUrl,
} from '@console/topology';
import SvgBoxedText from '../../../svg/SvgBoxedText';
import NodeShadows, { NODE_SHADOW_FILTER_ID_HOVER, NODE_SHADOW_FILTER_ID } from '../NodeShadows';

import './BaseNode.scss';

export type BaseNodeProps = {
  outerRadius: number;
  innerRadius?: number;
  icon?: string;
  kind?: string;
  children?: React.ReactNode;
  attachments?: React.ReactNode;
  element: Node;
  droppable?: boolean;
  dragging?: boolean;
  edgeDragging?: boolean;
  dropTarget?: boolean;
  canDrop?: boolean;
} & WithSelectionProps &
  WithDragNodeProps &
  WithDndDropProps &
  WithContextMenuProps &
  WithCreateConnectorProps;

const BaseNode: React.FC<BaseNodeProps> = ({
  outerRadius,
  innerRadius,
  icon,
  kind,
  element,
  selected,
  onSelect,
  children,
  attachments,
  dragNodeRef,
  dndDropRef,
  droppable,
  canDrop,
  dragging,
  edgeDragging,
  dropTarget,
  onHideCreateConnector,
  onShowCreateConnector,
  onContextMenu,
}) => {
  const [hover, hoverRef] = useHover();
  useAnchor(EllipseAnchor);
  const cx = element.getBounds().width / 2;
  const cy = element.getBounds().height / 2;

  const contentsClasses = classNames('odc2-base-node__contents', {
    'is-highlight': canDrop,
    'is-dragging': dragging || edgeDragging,
    'is-hover': (hover && !droppable) || (dropTarget && canDrop),
  });
  const refs = useCombineRefs<SVGEllipseElement>(hoverRef, dragNodeRef);

  React.useLayoutEffect(() => {
    if (hover) {
      onShowCreateConnector();
    } else {
      onHideCreateConnector();
    }
  }, [hover, onShowCreateConnector, onHideCreateConnector]);

  return (
    <g className="odc2-base-node">
      <NodeShadows />
      <g
        data-test-id="base-node-handler"
        onClick={onSelect}
        onContextMenu={onContextMenu}
        ref={refs}
      >
        <circle
          className={classNames('odc2-base-node__bg', { 'is-highlight': canDrop })}
          ref={dndDropRef}
          cx={cx}
          cy={cy}
          r={outerRadius}
          filter={createSvgIdUrl(
            hover || dragging || edgeDragging || dropTarget
              ? NODE_SHADOW_FILTER_ID_HOVER
              : NODE_SHADOW_FILTER_ID,
          )}
        />
        <g className={contentsClasses}>
          <image
            x={cx - innerRadius}
            y={cy - innerRadius}
            width={innerRadius * 2}
            height={innerRadius * 2}
            xlinkHref={icon}
          />
          {(kind || element.getLabel()) && (
            <SvgBoxedText
              className="odc2-base-node__label"
              x={cx}
              y={cy + outerRadius + 20}
              paddingX={8}
              paddingY={4}
              kind={kind}
              truncate={16}
            >
              {element.getLabel()}
            </SvgBoxedText>
          )}
          {selected && (
            <circle className="odc2-base-node__selection" cx={cx} cy={cy} r={outerRadius + 1} />
          )}
          {children}
        </g>
      </g>
      <g className={contentsClasses}>{attachments}</g>
    </g>
  );
};

export default observer(BaseNode);
