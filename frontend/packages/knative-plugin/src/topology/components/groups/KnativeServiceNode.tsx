import * as React from 'react';
import {
  observer,
  Node,
  useAnchor,
  useCombineRefs,
  useHover,
  useDragNode,
  WithDndDropProps,
  WithSelectionProps,
  WithContextMenuProps,
  createSvgIdUrl,
  WithCreateConnectorProps,
  useSize,
} from '@patternfly/react-topology';
import classnames from 'classnames';
import { useTranslation } from 'react-i18next';
import {
  NodeShadows,
  NODE_SHADOW_FILTER_ID,
  NODE_SHADOW_FILTER_ID_HOVER,
  nodeDragSourceSpec,
  GroupNode,
  GroupNodeAnchor,
} from '@console/topology/src/components/graph-view';
import { useSearchFilter, useAllowEdgeCreation } from '@console/topology/src/filters';
import { getResource } from '@console/topology/src/utils';
import { TYPE_KNATIVE_SERVICE, EVENT_MARKER_RADIUS } from '../../const';

type KnativeServiceNodeProps = {
  element: Node;
  highlight?: boolean;
  canDrop?: boolean;
  dropTarget?: boolean;
  edgeDragging?: boolean;
  editAccess: boolean;
} & WithSelectionProps &
  WithDndDropProps &
  WithContextMenuProps &
  WithCreateConnectorProps;

const KnativeServiceNode: React.FC<KnativeServiceNodeProps> = ({
  element,
  selected,
  onSelect,
  onContextMenu,
  contextMenuOpen,
  canDrop,
  dropTarget,
  edgeDragging,
  dndDropRef,
  editAccess,
  onHideCreateConnector,
  onShowCreateConnector,
}) => {
  const { t } = useTranslation();
  const [hover, hoverRef] = useHover();
  const dragSpec = React.useMemo(() => nodeDragSourceSpec(TYPE_KNATIVE_SERVICE, true, editAccess), [
    editAccess,
  ]);
  const dragProps = React.useMemo(() => ({ element }), [element]);
  const [{ dragging }, dragNodeRef] = useDragNode(dragSpec, dragProps);
  const refs = useCombineRefs<SVGRectElement>(hoverRef, dragNodeRef);
  const [filtered] = useSearchFilter(element.getLabel(), getResource(element)?.metadata?.labels);
  const allowEdgeCreation = useAllowEdgeCreation();
  const { kind } = element.getData().data;
  const { groupResources } = element.getData();
  const [groupSize, groupRef] = useSize([groupResources]);
  const width = groupSize ? groupSize.width : 0;
  const height = groupSize ? groupSize.height : 0;
  useAnchor(
    React.useCallback(
      (node: Node) => new GroupNodeAnchor(node, width, height, 1.5 + EVENT_MARKER_RADIUS),
      [height, width],
    ),
  );
  React.useLayoutEffect(() => {
    if (editAccess && allowEdgeCreation) {
      if (hover) {
        onShowCreateConnector && onShowCreateConnector();
      } else {
        onHideCreateConnector && onHideCreateConnector();
      }
    }
  }, [editAccess, hover, onShowCreateConnector, onHideCreateConnector, allowEdgeCreation]);

  return (
    <g
      ref={refs}
      onContextMenu={onContextMenu}
      onClick={onSelect}
      className={classnames('odc-knative-service', {
        'is-dragging': dragging,
        'is-highlight': canDrop || edgeDragging,
        'is-selected': selected,
        'is-dropTarget': canDrop && dropTarget,
        'is-filtered': filtered,
      })}
    >
      <NodeShadows />
      <rect
        key={hover || dragging || contextMenuOpen || dropTarget ? 'rect-hover' : 'rect'}
        ref={dndDropRef}
        className="odc-knative-service__bg"
        filter={createSvgIdUrl(
          hover || dragging || contextMenuOpen || dropTarget
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
        typeIconClass="icon-knative"
        groupResources={groupResources}
        emptyValue={t('knative-plugin~No Revisions')}
      />
    </g>
  );
};

export default observer(KnativeServiceNode);
