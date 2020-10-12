import * as React from 'react';
import * as classNames from 'classnames';
import {
  useAnchor,
  useHover,
  Node,
  createSvgIdUrl,
  useDragNode,
  WithSelectionProps,
  WithDndDropProps,
  WithContextMenuProps,
  observer,
  useCombineRefs,
  useSize,
} from '@patternfly/react-topology';
import {
  NodeShadows,
  NODE_SHADOW_FILTER_ID_HOVER,
  NODE_SHADOW_FILTER_ID,
} from '../../components/NodeShadows';
import { useSearchFilter } from '../../filters/useSearchFilter';
import { GroupNode } from '../../components/groups/GroupNode';
import { GroupNodeAnchor } from '../../components/groups/GroupNodeAnchor';
import { noRegroupDragSourceSpec } from '../../components/componentUtils';

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
        ref={groupRef}
        kind="HelmRelease"
        element={element}
        typeIconClass={element.getData().data.chartIcon || 'icon-helm'}
        groupResources={groupResources}
      />
    </g>
  );
};

export default observer(HelmReleaseNode);
