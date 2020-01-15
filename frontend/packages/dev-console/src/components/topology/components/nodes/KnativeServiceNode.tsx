import * as React from 'react';
import * as classNames from 'classnames';
import {
  observer,
  Node,
  useAnchor,
  RectAnchor,
  useCombineRefs,
  useHover,
  useSize,
  useDragNode,
  WithDndDropProps,
  WithSelectionProps,
  WithContextMenuProps,
  createSvgIdUrl,
} from '@console/topology';
import { TopologyFilters } from '../../filters/filter-utils';
import useFilter from '../../filters/useFilter';
import { nodeDragSourceSpec } from '../../componentUtils';
import { TYPE_KNATIVE_SERVICE } from '../../const';
import NodeShadows, { NODE_SHADOW_FILTER_ID, NODE_SHADOW_FILTER_ID_HOVER } from '../NodeShadows';
import SvgResourceIcon from './ResourceIcon';
import ResourceKindsInfo from './ResourceKindsInfo';

type KnativeServiceNodeProps = {
  element: Node;
  droppable?: boolean;
  hover?: boolean;
  dragging: boolean;
  highlight?: boolean;
  regrouping: boolean;
  canDrop?: boolean;
  dropTarget?: boolean;
  filters?: TopologyFilters;
  editAccess: boolean;
} & WithSelectionProps &
  WithDndDropProps &
  WithContextMenuProps;

const TOP_MARGIN = 20;
const LEFT_MARGIN = 20;
const TEXT_MARGIN = 10;
const RESOURCES_MARGIN = 40;

const KnativeServiceNode: React.FC<KnativeServiceNodeProps> = ({
  element,
  selected,
  onSelect,
  onContextMenu,
  contextMenuOpen,
  dragging,
  canDrop,
  dropTarget,
  dndDropRef,
  filters,
  editAccess,
}) => {
  useAnchor((e: Node) => new RectAnchor(e, 4));
  const [hover, hoverRef] = useHover();
  const [labelHover, labelHoverRef] = useHover();
  const dragNodeRef = useDragNode(nodeDragSourceSpec(TYPE_KNATIVE_SERVICE, true, editAccess), {
    element,
  })[1];
  const refs = useCombineRefs<SVGRectElement>(dragNodeRef, dndDropRef);
  const filtered = useFilter(filters, { metadata: { name: element.getLabel() } });
  const { kind } = element.getData().data;
  const [iconSize, iconRef] = useSize([kind]);
  const iconWidth = iconSize ? iconSize.width : 0;
  const iconHeight = iconSize ? iconSize.height : 0;

  const rectClasses = classNames('odc-knative-service', {
    'is-highlight': canDrop,
    'is-selected': selected,
    'is-hover': hover || labelHover || (canDrop && dropTarget) || contextMenuOpen,
    'is-filtered': filtered,
  });

  const { width, height } = element.getBounds();

  const title = (
    <g ref={labelHoverRef} className="odc-application-group__node-title" onClick={onSelect}>
      <SvgResourceIcon ref={iconRef} x={TOP_MARGIN} y={LEFT_MARGIN} kind={kind} leftJustified />
      <text
        x={LEFT_MARGIN + iconWidth + TEXT_MARGIN}
        y={TOP_MARGIN + iconHeight}
        textAnchor="start"
        dy="-0.25em"
      >
        {element.getLabel()}
      </text>
    </g>
  );

  return (
    <>
      <NodeShadows />
      <g ref={hoverRef} onContextMenu={onContextMenu} onClick={onSelect}>
        <rect
          ref={refs}
          filter={createSvgIdUrl(
            hover || labelHover || dragging || contextMenuOpen
              ? NODE_SHADOW_FILTER_ID_HOVER
              : NODE_SHADOW_FILTER_ID,
          )}
          className={rectClasses}
          x={0}
          y={0}
          width={width}
          height={height}
          rx="5"
          ry="5"
        />
      </g>
      <g>
        {title}
        <ResourceKindsInfo
          groupResources={element.getData().groupResources}
          offsetX={LEFT_MARGIN + iconWidth}
          offsetY={TOP_MARGIN + iconHeight + RESOURCES_MARGIN}
          emptyKind="Revisions"
        />
      </g>
    </>
  );
};

export default observer(KnativeServiceNode);
