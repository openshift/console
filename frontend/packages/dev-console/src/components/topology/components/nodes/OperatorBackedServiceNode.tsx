import * as React from 'react';
import * as classNames from 'classnames';
import {
  observer,
  Node,
  WithSelectionProps,
  WithDndDropProps,
  WithContextMenuProps,
  useAnchor,
  RectAnchor,
  useCombineRefs,
  useHover,
  useDragNode,
  createSvgIdUrl,
} from '@console/topology';
import useSearchFilter from '../../filters/useSearchFilter';
import { nodeDragSourceSpec } from '../../componentUtils';
import { TYPE_OPERATOR_BACKED_SERVICE } from '../../const';
import NodeShadows, { NODE_SHADOW_FILTER_ID, NODE_SHADOW_FILTER_ID_HOVER } from '../NodeShadows';
import GroupNode from './GroupNode';

export type OperatorBackedServiceNodeProps = {
  element: Node;
  editAccess: boolean;
} & WithSelectionProps &
  WithContextMenuProps &
  WithDndDropProps;

const OperatorBackedServiceNode: React.FC<OperatorBackedServiceNodeProps> = ({
  element,
  editAccess,
  selected,
  onSelect,
  onContextMenu,
  contextMenuOpen,
  dndDropRef,
}) => {
  useAnchor((e: Node) => new RectAnchor(e, 1.5));
  const [hover, hoverRef] = useHover();
  const [{ dragging }, dragNodeRef] = useDragNode(
    nodeDragSourceSpec(TYPE_OPERATOR_BACKED_SERVICE, true, editAccess),
    {
      element,
    },
  );
  const refs = useCombineRefs<SVGRectElement>(hoverRef, dragNodeRef, dndDropRef);
  const [filtered] = useSearchFilter(element.getLabel());
  const kind = 'Operator';
  const { width, height } = element.getBounds();

  return (
    <g
      ref={refs}
      onClick={onSelect}
      onContextMenu={editAccess ? onContextMenu : null}
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
        kind={kind}
        element={element}
        groupResources={element.getData().groupResources}
        typeIconClass={element.getData().data.builderImage}
      />
    </g>
  );
};

export default observer(OperatorBackedServiceNode);
