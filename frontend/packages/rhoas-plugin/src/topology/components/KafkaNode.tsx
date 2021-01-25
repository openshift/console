import * as React from 'react';
import * as classNames from 'classnames';
import {
  useAnchor,
  useHover,
  Node,
  createSvgIdUrl,
  useDragNode,
  observer,
  useCombineRefs,
  useSize,
} from '@patternfly/react-topology';
import {
  NodeShadows,
  NODE_SHADOW_FILTER_ID_HOVER,
  NODE_SHADOW_FILTER_ID,
  GroupNode,
  GroupNodeAnchor,
  noRegroupDragSourceSpec,
} from '@console/topology/src/components/graph-view';
import { useSearchFilter } from '@console/topology/src/filters/useSearchFilter';
import { ManagedKafkaConnectionModel } from '../../models';

const KafkaNode: React.FC<any> = ({
  element,
  editAccess,
  selected,
  onSelect,
  onContextMenu,
  contextMenuOpen,
  dndDropRef,
}) => {
  const [hover, hoverRef] = useHover();
  const [{ dragging }, dragNodeRef] = useDragNode(noRegroupDragSourceSpec);
  const refs = useCombineRefs<SVGRectElement>(dragNodeRef, dndDropRef, hoverRef);
  const [filtered] = useSearchFilter(element.getLabel());
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
    <g
      ref={refs}
      onClick={onSelect}
      onContextMenu={editAccess ? onContextMenu : null}
      className={classNames('odc-rhoas', {
        'is-dragging': dragging,
        'is-selected': selected,
        'is-filtered': filtered,
      })}
    >
      <NodeShadows />
      <rect
        key={hover || contextMenuOpen || dragging ? 'rect-hover' : 'rect'}
        filter={createSvgIdUrl(
          hover || contextMenuOpen || dragging
            ? NODE_SHADOW_FILTER_ID_HOVER
            : NODE_SHADOW_FILTER_ID,
        )}
        className="odc-helm-release__bg"
        x={0}
        y={0}
        width={width}
        height={height}
        rx="5"
        ry="5"
      />
      <GroupNode
        ref={groupRef}
        kind={ManagedKafkaConnectionModel.kind}
        element={element}
        typeIconClass={'icon-helm'}
        groupResources={groupResources}
      />
    </g>
  );
};

export default observer(KafkaNode);
