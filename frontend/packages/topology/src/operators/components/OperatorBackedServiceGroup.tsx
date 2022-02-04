import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import {
  Node,
  observer,
  WithSelectionProps,
  WithDndDropProps,
  useDragNode,
  Layer,
  useHover,
  createSvgIdUrl,
  useCombineRefs,
  useAnchor,
  RectAnchor,
  WithContextMenuProps,
} from '@patternfly/react-topology';
import classnames from 'classnames';
import { useTranslation } from 'react-i18next';
import { referenceFor } from '@console/internal/module/k8s';
import {
  noRegroupDragSourceSpec,
  NodeShadows,
  NODE_SHADOW_FILTER_ID,
  NODE_SHADOW_FILTER_ID_HOVER,
} from '../../components/graph-view';
import SvgBoxedText from '../../components/svg/SvgBoxedText';
import {
  getFilterById,
  useDisplayFilters,
  useSearchFilter,
  SHOW_LABELS_FILTER_ID,
} from '../../filters';
import { getResource, getResourceKind } from '../../utils/topology-utils';

type OperatorBackedServiceGroupProps = {
  element: Node;
  droppable?: boolean;
  canDrop?: boolean;
  dropTarget?: boolean;
  editAccess: boolean;
} & WithSelectionProps &
  WithContextMenuProps &
  WithDndDropProps;

const OperatorBackedServiceGroup: React.FC<OperatorBackedServiceGroupProps> = ({
  element,
  selected,
  editAccess,
  onSelect,
  dndDropRef,
  canDrop,
  dropTarget,
  onContextMenu,
  contextMenuOpen,
}) => {
  const { t } = useTranslation();
  const [hover, hoverRef] = useHover();
  const [innerHover, innerHoverRef] = useHover();
  const [{ dragging }, dragNodeRef] = useDragNode(noRegroupDragSourceSpec);
  const [{ dragging: labelDragging }, dragLabelRef] = useDragNode(noRegroupDragSourceSpec);
  const nodeRefs = useCombineRefs(innerHoverRef, dragNodeRef);
  const hasChildren = element.getChildren()?.length > 0;
  const { data } = element.getData();
  const ownerReferenceKind = referenceFor({ kind: data.operatorKind, apiVersion: data.apiVersion });
  const [filtered] = useSearchFilter(element.getLabel(), getResource(element)?.metadata?.labels);
  const displayFilters = useDisplayFilters();
  const showLabelsFilter = getFilterById(SHOW_LABELS_FILTER_ID, displayFilters);
  const showLabels = showLabelsFilter?.value || hover || innerHover;
  const { x, y, width, height } = element.getBounds();
  useAnchor(React.useCallback((node: Node) => new RectAnchor(node, 1.5), []));

  return (
    <g
      ref={hoverRef}
      onClick={onSelect}
      onContextMenu={editAccess ? onContextMenu : null}
      className={classnames('odc-operator-backed-service', {
        'is-dragging': dragging || labelDragging,
        'is-filtered': filtered,
        'is-highlight': canDrop,
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
            className={classnames('odc-operator-backed-service', {
              'is-selected': selected,
              'is-highlight': canDrop,
              'is-dragging': dragging || labelDragging,
              'is-filtered': filtered,
              'is-dropTarget': canDrop && dropTarget,
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
      {showLabels && (getResourceKind(element) || element.getLabel()) && (
        <SvgBoxedText
          className="odc-base-node__label"
          x={x + width / 2}
          y={y + height + 20}
          paddingX={8}
          paddingY={4}
          kind={ownerReferenceKind}
          dragRef={dragLabelRef}
          typeIconClass={data.builderImage}
        >
          {element.getLabel()}
        </SvgBoxedText>
      )}
    </g>
  );
};

export default observer(OperatorBackedServiceGroup);
