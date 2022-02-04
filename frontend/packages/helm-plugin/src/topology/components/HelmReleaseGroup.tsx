import * as React from 'react';
import {
  Layer,
  useHover,
  Node,
  createSvgIdUrl,
  useDragNode,
  WithSelectionProps,
  WithDndDropProps,
  WithContextMenuProps,
  observer,
  useCombineRefs,
} from '@patternfly/react-topology';
import classnames from 'classnames';
import {
  NodeShadows,
  NODE_SHADOW_FILTER_ID_HOVER,
  NODE_SHADOW_FILTER_ID,
  noRegroupDragSourceSpec,
} from '@console/topology/src/components/graph-view';
import SvgBoxedText from '@console/topology/src/components/svg/SvgBoxedText';
import {
  getFilterById,
  useDisplayFilters,
  useSearchFilter,
  SHOW_LABELS_FILTER_ID,
} from '@console/topology/src/filters';
import { getResource } from '@console/topology/src/utils';

type HelmReleaseGroupProps = {
  element: Node;
  editAccess: boolean;
} & WithSelectionProps &
  WithContextMenuProps &
  WithDndDropProps;

const HelmReleaseGroup: React.FC<HelmReleaseGroupProps> = ({
  element,
  editAccess,
  selected,
  onSelect,
  onContextMenu,
  contextMenuOpen,
  dndDropRef,
}) => {
  const [hover, hoverRef] = useHover();
  const [innerHover, innerHoverRef] = useHover();
  const [{ dragging }, dragNodeRef] = useDragNode(noRegroupDragSourceSpec);
  const [{ dragging: labelDragging }, dragLabelRef] = useDragNode(noRegroupDragSourceSpec);
  const nodeRefs = useCombineRefs(innerHoverRef, dragNodeRef);
  const [filtered] = useSearchFilter(element.getLabel(), getResource(element)?.metadata?.labels);
  const displayFilters = useDisplayFilters();
  const showLabelsFilter = getFilterById(SHOW_LABELS_FILTER_ID, displayFilters);
  const showLabels = showLabelsFilter?.value || hover || innerHover;
  const hasChildren = element.getChildren()?.length > 0;
  const { x, y, width, height } = element.getBounds();

  return (
    <g
      ref={hoverRef}
      onClick={onSelect}
      onContextMenu={editAccess ? onContextMenu : null}
      className={classnames('odc-helm-release', {
        'is-dragging': dragging || labelDragging,
        'is-filtered': filtered,
      })}
    >
      <NodeShadows />
      <Layer id={dragging || labelDragging ? undefined : 'groups2'}>
        <g
          ref={nodeRefs}
          className={classnames('odc-helm-release', {
            'is-selected': selected,
            'is-dragging': dragging || labelDragging,
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
      {showLabels && element.getLabel() && (
        <SvgBoxedText
          className="odc-base-node__label"
          x={x + width / 2}
          y={y + height + 20}
          paddingX={8}
          paddingY={4}
          kind="HelmRelease"
          dragRef={dragLabelRef}
          typeIconClass={element.getData().data.chartIcon || 'icon-helm'}
        >
          {element.getLabel()}
        </SvgBoxedText>
      )}
    </g>
  );
};

export default observer(HelmReleaseGroup);
