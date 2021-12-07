import * as React from 'react';
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
  WithContextMenuProps,
} from '@patternfly/react-topology';
import classnames from 'classnames';
import { useTranslation } from 'react-i18next';
import {
  noRegroupDragSourceSpec,
  NodeShadows,
  NODE_SHADOW_FILTER_ID,
  NODE_SHADOW_FILTER_ID_HOVER,
  GroupNode,
  GroupNodeAnchor,
} from '../../components/graph-view';
import { useSearchFilter } from '../../filters/useSearchFilter';
import { getResource } from '../../utils/topology-utils';

type OperatorBackedServiceNodeProps = {
  element: Node;
  droppable?: boolean;
  canDrop?: boolean;
  dropTarget?: boolean;
  editAccess: boolean;
} & WithSelectionProps &
  WithContextMenuProps &
  WithDndDropProps;

const OperatorBackedServiceNode: React.FC<OperatorBackedServiceNodeProps> = ({
  element,
  selected,
  onSelect,
  dndDropRef,
  canDrop,
  dropTarget,
  onContextMenu,
  contextMenuOpen,
  editAccess,
}) => {
  const { t } = useTranslation();
  const [hover, hoverRef] = useHover();
  const [{ dragging }, dragNodeRef] = useDragNode(noRegroupDragSourceSpec);
  const refs = useCombineRefs<SVGRectElement>(hoverRef, dragNodeRef, dndDropRef);
  const [filtered] = useSearchFilter(element.getLabel(), getResource(element)?.metadata?.labels);
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
      content={t('topology~Create Service Binding')}
      trigger="manual"
      isVisible={dropTarget && canDrop}
      animationDuration={0}
      position="top"
    >
      <g
        ref={refs}
        onClick={onSelect}
        onContextMenu={editAccess ? onContextMenu : null}
        className={classnames('odc-operator-backed-service', {
          'is-dragging': dragging,
          'is-highlight': canDrop,
          'is-selected': selected,
          'is-filtered': filtered,
          'is-dropTarget': canDrop && dropTarget,
        })}
      >
        <NodeShadows />
        <rect
          key={hover || contextMenuOpen || dragging ? 'rect-hover' : 'rect'}
          className="odc-operator-backed-service__bg"
          filter={createSvgIdUrl(
            hover || contextMenuOpen || dragging
              ? NODE_SHADOW_FILTER_ID_HOVER
              : NODE_SHADOW_FILTER_ID,
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
