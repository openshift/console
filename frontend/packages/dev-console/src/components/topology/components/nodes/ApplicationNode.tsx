import * as React from 'react';
import * as _ from 'lodash';
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
import NodeShadows, { NODE_SHADOW_FILTER_ID, NODE_SHADOW_FILTER_ID_HOVER } from '../NodeShadows';
import { getTopologyResourceObject } from '../../topology-utils';
import SvgResourceIcon from './ResourceIcon';
import ResourceKindsInfo from './ResourceKindsInfo';

type ApplicationGroupProps = {
  element: Node;
  canDrop?: boolean;
  dropTarget?: boolean;
  dragging?: boolean;
  filters?: TopologyFilters;
} & WithSelectionProps &
  WithDndDropProps &
  WithContextMenuProps;

const TOP_MARGIN = 20;
const LEFT_MARGIN = 20;
const TEXT_MARGIN = 10;
const RESOURCES_MARGIN = 40;

const ApplicationNode: React.FC<ApplicationGroupProps> = ({
  element,
  selected,
  onSelect,
  dndDropRef,
  canDrop,
  dropTarget,
  onContextMenu,
  contextMenuOpen,
  dragging,
  filters,
}) => {
  useAnchor((e: Node) => new RectAnchor(e, 4));
  const [hover, hoverRef] = useHover();
  const dragNodeRef = useDragNode()[1];
  const refs = useCombineRefs<SVGRectElement>(dragNodeRef, dndDropRef, hoverRef);
  const filtered = useFilter(filters, { metadata: { name: element.getLabel() } });
  const kind = 'application';
  const [iconSize, iconRef] = useSize([kind]);
  const iconWidth = iconSize ? iconSize.width : 0;
  const iconHeight = iconSize ? iconSize.height : 0;

  const rectClasses = classNames('odc-application-group', {
    'is-highlight': canDrop,
    'is-selected': selected,
    'is-hover': hover || (canDrop && dropTarget) || contextMenuOpen,
    'is-filtered': filtered,
  });

  const { width, height } = element.getBounds();

  const title = (
    <g className="odc-application-group__node-title">
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

  const resourcesData = {};
  _.forEach(element.getData().groupResources, (res) => {
    const a = getTopologyResourceObject(res);
    resourcesData[a.kind] = [...(resourcesData[a.kind] ? resourcesData[a.kind] : []), a];
  });

  return (
    <>
      <NodeShadows />
      <g ref={refs} onContextMenu={onContextMenu} onClick={onSelect}>
        <rect
          filter={createSvgIdUrl(
            hover || dragging || contextMenuOpen
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
        {title}
        <ResourceKindsInfo
          groupResources={element.getData().groupResources}
          offsetX={LEFT_MARGIN + iconWidth}
          offsetY={TOP_MARGIN + iconHeight + RESOURCES_MARGIN}
        />
      </g>
    </>
  );
};

export default observer(ApplicationNode);
