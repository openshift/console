import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import {
  Node,
  observer,
  WithSelectionProps,
  WithDndDropProps,
  WithDragNodeProps,
  useDragNode,
  Layer,
  useHover,
  createSvgIdUrl,
  useCombineRefs,
  useAnchor,
  RectAnchor,
  WithContextMenuProps,
  NodeLabel,
} from '@patternfly/react-topology';
import * as classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import {
  noRegroupDragSourceSpec,
  NodeShadows,
  NODE_SHADOW_FILTER_ID,
  NODE_SHADOW_FILTER_ID_HOVER,
} from '../../components/graph-view';
import { useSearchFilter } from '../../filters';
import { useShowLabel } from '../../filters/useShowLabel';
import { getResource } from '../../utils/topology-utils';

type OperatorBackedServiceGroupProps = {
  element: Node;
  droppable?: boolean;
  canDrop?: boolean;
  dropTarget?: boolean;
  editAccess: boolean;
  badge?: string;
  badgeColor?: string;
  badgeClassName?: string;
  dragging?: boolean;
} & WithSelectionProps &
  WithContextMenuProps &
  WithDndDropProps &
  WithDragNodeProps;

const OperatorBackedServiceGroup: React.FC<OperatorBackedServiceGroupProps> = ({
  element,
  selected,
  editAccess,
  badge,
  badgeColor,
  badgeClassName,
  onSelect,
  dndDropRef,
  dragNodeRef,
  dragging,
  canDrop,
  dropTarget,
  onContextMenu,
  contextMenuOpen,
}) => {
  const { t } = useTranslation();
  const [hover, hoverRef] = useHover();
  const [innerHover, innerHoverRef] = useHover();
  const [{ dragging: labelDragging }, dragLabelRef] = useDragNode(noRegroupDragSourceSpec);
  const nodeRefs = useCombineRefs(innerHoverRef, dragNodeRef);
  const hasChildren = element.getChildren()?.length > 0;
  const { data } = element.getData();
  const [filtered] = useSearchFilter(element.getLabel(), getResource(element)?.metadata?.labels);
  const showLabel = useShowLabel(hover || innerHover);
  const { x, y, width, height } = element.getBounds();
  useAnchor(React.useCallback((node: Node) => new RectAnchor(node, 1.5), []));

  return (
    <g
      ref={hoverRef}
      onClick={onSelect}
      onContextMenu={editAccess ? onContextMenu : null}
      className={classNames('odc-operator-backed-service', {
        'pf-m-dragging': dragging || labelDragging,
        'is-filtered': filtered,
        'pf-m-highlight': canDrop,
      })}
    >
      <NodeShadows />
      <Layer id={dragging || labelDragging ? undefined : 'groups2'}>
        <Tooltip
          content={t('topology~Create Service Binding')}
          trigger="manual"
          isVisible={dropTarget && canDrop}
          animationDuration={0}
          position="top"
        >
          <g
            ref={nodeRefs}
            className={classNames('odc-operator-backed-service', {
              'pf-m-selected': selected,
              'pf-m-highlight': canDrop,
              'pf-m-dragging': dragging || labelDragging,
              'is-filtered': filtered,
              'pf-m-drop-target': canDrop && dropTarget,
            })}
          >
            <rect
              key={
                hover || innerHover || contextMenuOpen || dragging || labelDragging
                  ? 'rect-hover'
                  : 'rect'
              }
              ref={dndDropRef}
              className="odc-operator-backed-service__bg"
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
        </Tooltip>
      </Layer>
      {showLabel && (data.kind || element.getLabel()) && (
        <NodeLabel
          className="pf-topology__group__label odc-knative-service__label odc-base-node__label"
          onContextMenu={onContextMenu}
          contextMenuOpen={contextMenuOpen}
          x={x + width / 2}
          y={y + height + 20}
          paddingX={8}
          paddingY={4}
          labelIconClass={data.builderImage}
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

export default observer(OperatorBackedServiceGroup);
