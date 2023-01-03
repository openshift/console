import * as React from 'react';
import {
  Layer,
  useHover,
  Node,
  createSvgIdUrl,
  useDragNode,
  WithSelectionProps,
  WithDndDropProps,
  WithDragNodeProps,
  WithContextMenuProps,
  observer,
  useCombineRefs,
  NodeLabel,
} from '@patternfly/react-topology';
import * as classNames from 'classnames';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import {
  NodeShadows,
  NODE_SHADOW_FILTER_ID_HOVER,
  NODE_SHADOW_FILTER_ID,
  noRegroupDragSourceSpec,
} from '@console/topology/src/components/graph-view';
import { getNodeDecorators } from '@console/topology/src/components/graph-view/components/nodes/decorators/getNodeDecorators';
import { useSearchFilter } from '@console/topology/src/filters';
import { useShowLabel } from '@console/topology/src/filters/useShowLabel';
import { getResource } from '@console/topology/src/utils';

type HelmReleaseGroupProps = {
  element: Node;
  badge?: string;
  badgeColor?: string;
  badgeClassName?: string;
  editAccess: boolean;
  dragging?: boolean;
} & WithSelectionProps &
  WithContextMenuProps &
  WithDragNodeProps &
  WithDndDropProps;

const DECORATOR_RADIUS = 13;
const HelmReleaseGroup: React.FC<HelmReleaseGroupProps> = ({
  element,
  badge,
  badgeColor,
  badgeClassName,
  editAccess,
  selected,
  onSelect,
  onContextMenu,
  contextMenuOpen,
  dndDropRef,
  dragging,
  dragNodeRef,
}) => {
  const [hover, hoverRef] = useHover();
  const [innerHover, innerHoverRef] = useHover();
  const [{ dragging: labelDragging }, dragLabelRef] = useDragNode(noRegroupDragSourceSpec);
  const nodeRefs = useCombineRefs(innerHoverRef, dragNodeRef);
  const [filtered] = useSearchFilter(element.getLabel(), getResource(element)?.metadata?.labels);
  const showLabel = useShowLabel(hover);
  const hasChildren = element.getChildren()?.length > 0;
  const { x, y, width, height } = element.getBounds();
  const typeIconClass = element.getData().data.chartIcon || 'icon-helm';

  const decorators = getNodeDecorators(
    element,
    element.getGraph().getData().decorators,
    x + width / 2,
    y + height / 2,
    -1,
    DECORATOR_RADIUS,
    width,
    height,
  );

  return (
    <g
      ref={hoverRef}
      onClick={onSelect}
      onContextMenu={editAccess ? onContextMenu : null}
      className={classNames('pf-topology__group odc-helm-release', {
        'pf-m-dragging': dragging || labelDragging,
        'is-filtered': filtered,
      })}
    >
      <NodeShadows />
      <Layer id={dragging || labelDragging ? undefined : 'groups2'}>
        <g
          ref={nodeRefs}
          className={classNames('odc-helm-release', {
            'pf-m-selected': selected,
            'pf-m-dragging': dragging || labelDragging,
            'is-filtered': filtered,
          })}
        >
          <rect
            key={
              hover || innerHover || contextMenuOpen || dragging || labelDragging
                ? 'rect-hover'
                : 'rect'
            }
            ref={dndDropRef}
            className="odc-helm-release__bg"
            x={x}
            y={y}
            width={width}
            height={height}
            rx="5"
            ry="5"
            filter={createSvgIdUrl(
              hover || innerHover || contextMenuOpen || dragging || labelDragging
                ? NODE_SHADOW_FILTER_ID_HOVER
                : NODE_SHADOW_FILTER_ID,
            )}
          />
          {!hasChildren && (
            <text x={x + width / 2} y={y + height / 2} dy="0.35em" textAnchor="middle">
              No Resources
            </text>
          )}
        </g>
      </Layer>
      {decorators}
      {showLabel && element.getLabel() && (
        <NodeLabel
          className="pf-topology__group__label odc-base-node__label"
          onContextMenu={onContextMenu}
          contextMenuOpen={contextMenuOpen}
          x={x + width / 2}
          y={y + height + 20}
          paddingX={8}
          paddingY={4}
          labelIconClass={getImageForIconClass(typeIconClass) || typeIconClass}
          badge={badge}
          badgeColor={badgeColor}
          badgeClassName={badgeClassName}
          dragRef={dragLabelRef}
        >
          {element.getLabel()}
        </NodeLabel>
      )}
    </g>
  );
};

export default observer(HelmReleaseGroup);
