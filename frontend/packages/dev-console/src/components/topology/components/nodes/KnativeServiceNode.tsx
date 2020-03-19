import * as React from 'react';
import * as classNames from 'classnames';
import {
  observer,
  Node,
  useAnchor,
  RectAnchor,
  useCombineRefs,
  useHover,
  useDragNode,
  WithDndDropProps,
  WithSelectionProps,
  WithContextMenuProps,
  createSvgIdUrl,
  WithCreateConnectorProps,
} from '@console/topology';
import useSearchFilter from '../../filters/useSearchFilter';
import { nodeDragSourceSpec } from '../../componentUtils';
import { TYPE_KNATIVE_SERVICE } from '../../const';
import NodeShadows, { NODE_SHADOW_FILTER_ID, NODE_SHADOW_FILTER_ID_HOVER } from '../NodeShadows';
import GroupNode from './GroupNode';

type KnativeServiceNodeProps = {
  element: Node;
  highlight?: boolean;
  canDrop?: boolean;
  dropTarget?: boolean;
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
  dndDropRef,
  editAccess,
  onHideCreateConnector,
  onShowCreateConnector,
}) => {
  useAnchor(React.useCallback((node: Node) => new RectAnchor(node, 1.5), []));
  const [hover, hoverRef] = useHover();
  const [{ dragging }, dragNodeRef] = useDragNode(
    nodeDragSourceSpec(TYPE_KNATIVE_SERVICE, true, editAccess),
    {
      element,
    },
  );
  const refs = useCombineRefs<SVGRectElement>(hoverRef, dragNodeRef);
  const [filtered] = useSearchFilter(element.getLabel());
  const { kind } = element.getData().data;
  const { width, height } = element.getBounds();

  React.useLayoutEffect(() => {
    if (editAccess) {
      if (hover) {
        onShowCreateConnector && onShowCreateConnector();
      } else {
        onHideCreateConnector && onHideCreateConnector();
      }
    }
  }, [editAccess, hover, onShowCreateConnector, onHideCreateConnector]);

  return (
    <g
      ref={refs}
      onContextMenu={onContextMenu}
      onClick={onSelect}
      className={classNames('odc-knative-service', {
        'is-dragging': dragging,
        'is-highlight': canDrop,
        'is-selected': selected,
        'is-dropTarget': canDrop && dropTarget,
        'is-filtered': filtered,
      })}
    >
      <NodeShadows />
      <rect
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
        kind={kind}
        element={element}
        typeIconClass="icon-knative"
        groupResources={element.getData().groupResources}
        emptyValue="No Revisions"
      />
    </g>
  );
};

export default observer(KnativeServiceNode);
