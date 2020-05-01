import * as React from 'react';
import * as classNames from 'classnames';
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
} from '@console/topology';
import {
  NodeShadows,
  NODE_SHADOW_FILTER_ID_HOVER,
  NODE_SHADOW_FILTER_ID,
} from '../../components/NodeShadows';
import SvgBoxedText from '../../../svg/SvgBoxedText';
import { useDisplayFilters, useSearchFilter } from '../../filters';
import { nodeDragSourceSpec } from '../../components/componentUtils';
import { TYPE_HELM_RELEASE } from './const';

export type HelmReleaseGroupProps = {
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
  const dragSpec = nodeDragSourceSpec(TYPE_HELM_RELEASE, false);
  const [{ dragging, regrouping }, dragNodeRef] = useDragNode(dragSpec, { element });
  const [
    { dragging: labelDragging, regrouping: labelRegrouping },
    dragLabelRef,
  ] = useDragNode(dragSpec, { element });

  const nodeRefs = useCombineRefs(innerHoverRef, dragNodeRef);
  const [filtered] = useSearchFilter(element.getLabel());
  const displayFilters = useDisplayFilters();
  const showLabels = displayFilters.showLabels || hover || innerHover;
  const hasChildren = element.getChildren()?.length > 0;
  const { x, y, width, height } = element.getBounds();

  return (
    <g
      ref={hoverRef}
      onClick={onSelect}
      onContextMenu={editAccess ? onContextMenu : null}
      className={classNames('odc-helm-release', {
        'is-dragging': dragging || labelDragging,
        'is-filtered': filtered,
      })}
    >
      <NodeShadows />
      <Layer
        id={(dragging || labelDragging) && (regrouping || labelRegrouping) ? undefined : 'groups2'}
      >
        <g
          ref={nodeRefs}
          className={classNames('odc-helm-release', {
            'is-selected': selected,
            'is-dragging': dragging || labelDragging,
            'is-filtered': filtered,
          })}
        >
          <rect
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
