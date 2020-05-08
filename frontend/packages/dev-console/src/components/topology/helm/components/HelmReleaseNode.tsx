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
  WithDndDropProps,
  WithContextMenuProps,
  observer,
  useCombineRefs,
} from '@console/topology';
import {
  NodeShadows,
  NODE_SHADOW_FILTER_ID_HOVER,
  NODE_SHADOW_FILTER_ID,
} from '../../components/NodeShadows';
import { useSearchFilter } from '../../filters/useSearchFilter';
import { GroupNode } from '../../components/groups/GroupNode';
import { nodeDragSourceSpec } from '../../components/componentUtils';
import { TYPE_HELM_RELEASE } from './const';

export type HelmReleaseNodeProps = {
  element: Node;
  editAccess: boolean;
} & WithSelectionProps &
  WithContextMenuProps &
  WithDndDropProps;

const HelmReleaseNode: React.FC<HelmReleaseNodeProps> = ({
  element,
  editAccess,
  selected,
  onSelect,
  onContextMenu,
  contextMenuOpen,
  dndDropRef,
}) => {
  useAnchor(React.useCallback((node: Node) => new RectAnchor(node, 1.5), []));
  const [hover, hoverRef] = useHover();
  const [{ dragging }, dragNodeRef] = useDragNode(nodeDragSourceSpec(TYPE_HELM_RELEASE, false), {
    element,
  });
  const refs = useCombineRefs<SVGRectElement>(dragNodeRef, dndDropRef, hoverRef);
  const [filtered] = useSearchFilter(element.getLabel());
  const { width, height } = element.getDimensions();

  return (
    <g
      ref={refs}
      onClick={onSelect}
      onContextMenu={editAccess ? onContextMenu : null}
      className={classNames('odc-helm-release', {
        'is-dragging': dragging,
        'is-selected': selected,
        'is-filtered': filtered,
      })}
    >
      <NodeShadows />
      <rect
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
        kind="HelmRelease"
        element={element}
        typeIconClass="icon-helm"
        groupResources={element.getData().groupResources}
      />
    </g>
  );
};

export default observer(HelmReleaseNode);
