import * as React from 'react';
import * as classNames from 'classnames';
import {
  useAnchor,
  RectAnchor,
  useHover,
  useSize,
  Node,
  createSvgIdUrl,
  useDragNode,
  observer,
  useCombineRefs,
} from '@console/topology';
import NodeShadows, { NODE_SHADOW_FILTER_ID_HOVER, NODE_SHADOW_FILTER_ID } from '../NodeShadows';
import { TopologyFilters } from '../../filters/filter-utils';
import useFilter from '../../filters/useFilter';
import SvgResourceIcon from '../nodes/ResourceIcon';
import ResourceKindsInfo from '../nodes/ResourceKindsInfo';

export type HelmReleaseNodeProps = {
  element: Node;
  dragging?: boolean;
  filters: TopologyFilters;
};

const TOP_MARGIN = 20;
const LEFT_MARGIN = 20;
const TEXT_MARGIN = 10;
const RESOURCES_MARGIN = 40;

const HelmReleaseNode: React.FC<HelmReleaseNodeProps> = ({ element, dragging, filters }) => {
  useAnchor((e: Node) => new RectAnchor(e, 4));
  const [hover, hoverRef] = useHover();
  const [labelHover, labelHoverRef] = useHover();
  const dragNodeRef = useDragNode()[1];
  const refs = useCombineRefs<SVGRectElement>(dragNodeRef, hoverRef);
  const filtered = useFilter(filters, { metadata: { name: element.getLabel() } });
  const kind = 'HelmRelease';
  const [iconSize, iconRef] = useSize([kind]);
  const iconWidth = iconSize ? iconSize.width : 0;
  const iconHeight = iconSize ? iconSize.height : 0;

  const rectClasses = classNames('odc-helm-release', {
    'is-hover': hover || labelHover,
    'is-filtered': filtered,
  });

  const { width, height } = element.getBounds();

  const title = (
    <g ref={labelHoverRef} className="odc-application-group__node-title">
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
      <g ref={hoverRef}>
        <rect
          ref={refs}
          filter={createSvgIdUrl(
            hover || labelHover || dragging ? NODE_SHADOW_FILTER_ID_HOVER : NODE_SHADOW_FILTER_ID,
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
        />
      </g>
    </>
  );
};

export default observer(HelmReleaseNode);
