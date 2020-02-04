import * as React from 'react';
import * as classNames from 'classnames';
import {
  useAnchor,
  RectAnchor,
  useHover,
  Node,
  createSvgIdUrl,
  useDragNode,
  WithSelectionProps,
  observer,
  useCombineRefs,
} from '@console/topology';
import NodeShadows, { NODE_SHADOW_FILTER_ID_HOVER, NODE_SHADOW_FILTER_ID } from '../NodeShadows';
import useSearchFilter from '../../filters/useSearchFilter';
import ResourceKindsInfo from '../nodes/ResourceKindsInfo';
import GroupNode from '../nodes/GroupNode';

export type HelmReleaseNodeProps = {
  element: Node;
} & WithSelectionProps;

const HelmReleaseNode: React.FC<HelmReleaseNodeProps> = ({ element, onSelect, selected }) => {
  useAnchor((e: Node) => new RectAnchor(e, 4));
  const [hover, hoverRef] = useHover();
  const [{ dragging }, dragNodeRef] = useDragNode({
    collect: (monitor) => ({
      dragging: monitor.isDragging(),
    }),
  });
  const refs = useCombineRefs<SVGRectElement>(dragNodeRef, hoverRef);
  const [filtered] = useSearchFilter(element.getLabel());
  const { width, height } = element.getBounds();

  return (
    <g
      ref={refs}
      onClick={onSelect}
      className={classNames('odc-knative-service', {
        'is-dragging': dragging,
        'is-selected': selected,
        'is-filtered': filtered,
      })}
    >
      <NodeShadows />
      <rect
        filter={createSvgIdUrl(
          hover || dragging ? NODE_SHADOW_FILTER_ID_HOVER : NODE_SHADOW_FILTER_ID,
        )}
        className="odc-helm-release__bg"
        x={0}
        y={0}
        width={width}
        height={height}
        rx="5"
        ry="5"
      />
      <GroupNode kind="HelmRelease" title={element.getLabel()} typeIconClass="icon-helm">
        <ResourceKindsInfo groupResources={element.getData().groupResources} />
      </GroupNode>
    </g>
  );
};

export default observer(HelmReleaseNode);
