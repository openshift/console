import * as React from 'react';
import * as classNames from 'classnames';
import {
  observer,
  Node,
  WithSelectionProps,
  WithDndDropProps,
  useAnchor,
  RectAnchor,
  useCombineRefs,
  useHover,
  useDragNode,
  createSvgIdUrl,
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

export type OperatorBackedServiceNodeProps = {
  element: Node;
} & WithSelectionProps &
  WithDndDropProps;

const OperatorBackedServiceNode: React.FC<OperatorBackedServiceNodeProps> = ({
  element,
  selected,
  onSelect,
  dndDropRef,
}) => {
  useAnchor(React.useCallback((node: Node) => new RectAnchor(node, 1.5), []));
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
  const { width, height } = element.getDimensions();

  return (
    <g
      ref={refs}
      onClick={onSelect}
      className={classNames('odc-operator-backed-service', {
        'is-dragging': dragging,
        'is-selected': selected,
        'is-filtered': filtered,
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
        kind={kind}
        element={element}
        groupResources={element.getData().groupResources}
        typeIconClass={element.getData().data.builderImage}
      />
    </g>
  );
};

export default observer(OperatorBackedServiceNode);
