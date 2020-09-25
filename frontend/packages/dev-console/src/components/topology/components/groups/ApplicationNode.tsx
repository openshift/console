import * as React from 'react';
import * as classNames from 'classnames';
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
  useSize,
} from '@patternfly/react-topology';
import { useSearchFilter } from '../../filters/useSearchFilter';
import { NodeShadows, NODE_SHADOW_FILTER_ID, NODE_SHADOW_FILTER_ID_HOVER } from '../NodeShadows';
import { ApplicationModel } from '../../../../models';
import { GroupNodeAnchor } from './GroupNodeAnchor';
import { GroupNode } from './GroupNode';

type ApplicationGroupProps = {
  element: Node;
  canDrop?: boolean;
  dropTarget?: boolean;
  dragging?: boolean;
} & WithSelectionProps &
  WithDndDropProps &
  WithContextMenuProps;

const ApplicationNode: React.FC<ApplicationGroupProps> = ({
  element,
  selected,
  onSelect,
  dndDropRef,
  canDrop,
  dropTarget,
  onContextMenu,
  contextMenuOpen,
  dragging,
}) => {
  const [hover, hoverRef] = useHover();
  const dragNodeRef = useDragNode()[1];
  const refs = useCombineRefs<SVGRectElement>(dragNodeRef, hoverRef);
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
      onContextMenu={onContextMenu}
      onClick={onSelect}
      className={classNames('odc-application-group', {
        'is-highlight': canDrop,
        'is-dragging': dragging,
        'is-selected': selected,
        'is-dropTarget': canDrop && dropTarget,
        'is-filtered': filtered,
      })}
    >
      <NodeShadows />
      <rect
        ref={dndDropRef}
        filter={createSvgIdUrl(
          hover || dragging || contextMenuOpen || dropTarget
            ? NODE_SHADOW_FILTER_ID_HOVER
            : NODE_SHADOW_FILTER_ID,
        )}
        className="odc-application-group__bg"
        x={0}
        y={0}
        width={width}
        height={height}
        rx="5"
        ry="5"
      />
      <GroupNode
        ref={groupRef}
        element={element}
        kind={ApplicationModel.kind}
        groupResources={element.getData().groupResources}
      />
    </g>
  );
};

export default observer(ApplicationNode);
