import * as React from 'react';
import * as classNames from 'classnames';
import { Tooltip } from '@patternfly/react-core';
import {
  observer,
  Node,
  WithSelectionProps,
  WithDndDropProps,
  useAnchor,
  useCombineRefs,
  useHover,
  useDragNode,
  createSvgIdUrl,
  useSize,
} from '@patternfly/react-topology';
import { useSearchFilter } from '../../filters/useSearchFilter';
import { nodeDragSourceSpec } from '../../components/componentUtils';
import { TYPE_OPERATOR_BACKED_SERVICE } from './const';
import {
  NodeShadows,
  NODE_SHADOW_FILTER_ID,
  NODE_SHADOW_FILTER_ID_HOVER,
} from '../../components/NodeShadows';
import { GroupNode } from '../../components/groups/GroupNode';
import { GroupNodeAnchor } from '../../components/groups/GroupNodeAnchor';

export type OperatorBackedServiceNodeProps = {
  element: Node;
  droppable?: boolean;
  canDrop?: boolean;
  dropTarget?: boolean;
} & WithSelectionProps &
  WithDndDropProps;

const OperatorBackedServiceNode: React.FC<OperatorBackedServiceNodeProps> = ({
  element,
  selected,
  onSelect,
  dndDropRef,
  canDrop,
  dropTarget,
}) => {
  const [hover, hoverRef] = useHover();
  const [{ dragging }, dragNodeRef] = useDragNode(
    nodeDragSourceSpec(TYPE_OPERATOR_BACKED_SERVICE, false),
    {
      element,
    },
  );
  const refs = useCombineRefs<SVGRectElement>(hoverRef, dragNodeRef, dndDropRef);
  const [filtered] = useSearchFilter(element.getLabel());
  const kind = 'Operator';
  const { groupResources } = element.getData();
  const [groupSize, groupRef] = useSize([groupResources]);
  const width = groupSize ? groupSize.width : 0;
  const height = groupSize ? groupSize.height : 0;
  useAnchor(
    React.useCallback((node: Node) => new GroupNodeAnchor(node, width, height, 1.5), [
      width,
      height,
    ]),
  );

  return (
    <Tooltip
      content="Create a binding connector"
      trigger="manual"
      isVisible={dropTarget && canDrop}
      animationDuration={0}
      position="top"
    >
      <g
        ref={refs}
        onClick={onSelect}
        className={classNames('odc-operator-backed-service', {
          'is-dragging': dragging,
          'is-highlight': canDrop,
          'is-selected': selected,
          'is-filtered': filtered,
          'is-dropTarget': canDrop && dropTarget,
        })}
      >
        <NodeShadows />
        <rect
          className="odc-operator-backed-service__bg"
          filter={createSvgIdUrl(
            hover || dragging ? NODE_SHADOW_FILTER_ID_HOVER : NODE_SHADOW_FILTER_ID,
          )}
          x={0}
          y={0}
          width={width}
          height={height}
          rx="5"
          ry="5"
        />
        <GroupNode
          ref={groupRef}
          kind={kind}
          element={element}
          groupResources={groupResources}
          typeIconClass={element.getData().data.builderImage}
        />
      </g>
    </Tooltip>
  );
};

export default observer(OperatorBackedServiceNode);
