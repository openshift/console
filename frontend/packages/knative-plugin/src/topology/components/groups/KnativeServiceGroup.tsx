import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import {
  Node,
  AnchorEnd,
  observer,
  WithSelectionProps,
  WithContextMenuProps,
  WithDndDropProps,
  WithDragNodeProps,
  RectAnchor,
  useAnchor,
  useDragNode,
  Layer,
  createSvgIdUrl,
  useCombineRefs,
  NodeLabel,
} from '@patternfly/react-topology';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import { WithCreateConnectorProps, useHover } from '@console/topology/src/behavior';
import {
  NodeShadows,
  NODE_SHADOW_FILTER_ID,
  NODE_SHADOW_FILTER_ID_HOVER,
  NodeDragSourceSpecType,
} from '@console/topology/src/components/graph-view';
import { getNodeDecorators } from '@console/topology/src/components/graph-view/components/nodes/decorators/getNodeDecorators';
import { useSearchFilter } from '@console/topology/src/filters';
import { useShowLabel } from '@console/topology/src/filters/useShowLabel';
import { getResource } from '@console/topology/src/utils/topology-utils';
import { isServerlessFunction } from '../../knative-topology-utils';
import RevisionTrafficSourceAnchor from '../anchors/RevisionTrafficSourceAnchor';

export type KnativeServiceGroupProps = {
  element: Node;
  badge?: string;
  badgeColor?: string;
  badgeClassName?: string;
  highlight?: boolean;
  dragSpec?: NodeDragSourceSpecType;
  dragging?: boolean;
  regrouping?: boolean;
  canDrop?: boolean;
  dropTarget?: boolean;
  edgeDragging?: boolean;
  editAccess?: boolean;
  tooltipLabel?: string;
} & WithSelectionProps &
  WithDndDropProps &
  WithDragNodeProps &
  WithContextMenuProps &
  WithCreateConnectorProps;

const DECORATOR_RADIUS = 13;
const KnativeServiceGroup: React.FC<KnativeServiceGroupProps> = ({
  element,
  badge,
  badgeColor,
  badgeClassName,
  selected,
  onSelect,
  onContextMenu,
  contextMenuOpen,
  dragNodeRef,
  dragSpec,
  dragging,
  regrouping,
  canDrop,
  dropTarget,
  edgeDragging,
  dndDropRef,
  editAccess,
  tooltipLabel,
  children,
  onHideCreateConnector,
  onShowCreateConnector,
  createConnectorDrag,
}) => {
  const { t } = useTranslation();
  const [hoverChange, setHoverChange] = React.useState<boolean>(false);
  const [hover, hoverRef] = useHover(200, 200, [hoverChange]);
  const [innerHover, innerHoverRef] = useHover();
  const dragProps = React.useMemo(() => ({ element }), [element]);
  const [{ dragging: labelDragging, regrouping: labelRegrouping }, dragLabelRef] = useDragNode(
    dragSpec,
    dragProps,
  );
  const nodeRefs = useCombineRefs(innerHoverRef, dragNodeRef);
  const hasChildren = element.getChildren()?.length > 0;
  const { data } = element.getData();
  const hasDataUrl = !!data.url;
  useAnchor(
    React.useCallback(
      (node: Node) => new RevisionTrafficSourceAnchor(node, hasDataUrl ? DECORATOR_RADIUS : 0),
      [hasDataUrl],
    ),
    AnchorEnd.source,
    'revision-traffic',
  );
  useAnchor(RectAnchor);

  const [filtered] = useSearchFilter(element.getLabel(), getResource(element)?.metadata?.labels);
  const showLabel = useShowLabel(hover);
  const { x, y, width, height } = element.getBounds();

  React.useLayoutEffect(() => {
    if (editAccess) {
      if (innerHover) {
        onShowCreateConnector && onShowCreateConnector();
      } else {
        onHideCreateConnector && onHideCreateConnector();
      }
    }
  }, [editAccess, innerHover, onShowCreateConnector, onHideCreateConnector]);

  React.useEffect(() => {
    if (!createConnectorDrag) {
      setHoverChange((prev) => !prev);
    }
  }, [createConnectorDrag]);

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

  const typeIconClass: string = isServerlessFunction(getResource(element))
    ? 'icon-serverless-function'
    : 'icon-knative';

  return (
    <Tooltip
      content={tooltipLabel}
      trigger="manual"
      isVisible={dropTarget && canDrop}
      animationDuration={0}
    >
      <g
        ref={hoverRef}
        onClick={onSelect}
        onContextMenu={onContextMenu}
        className={classNames('odc-knative-service', {
          'pf-m-dragging': dragging || labelDragging,
          'pf-m-highlight': canDrop || edgeDragging,
          'is-filtered': filtered,
        })}
      >
        <NodeShadows />
        <Layer
          id={
            (dragging || labelDragging) && (regrouping || labelRegrouping) ? undefined : 'groups2'
          }
        >
          <g
            ref={nodeRefs}
            className={classNames('odc-knative-service', {
              'pf-m-selected': selected,
              'pf-m-dragging': dragging || labelDragging,
              'pf-m-highlight': canDrop || edgeDragging,
              'pf-m-drop-target': canDrop && dropTarget,
              'is-filtered': filtered,
              'is-function': isServerlessFunction(getResource(element)),
            })}
          >
            <rect
              key={
                hover || innerHover || dragging || labelDragging || contextMenuOpen || dropTarget
                  ? 'rect-hover'
                  : 'rect'
              }
              ref={dndDropRef}
              className="odc-knative-service__bg"
              x={x}
              y={y}
              width={width}
              height={height}
              rx="5"
              ry="5"
              filter={createSvgIdUrl(
                hover || innerHover || dragging || labelDragging || contextMenuOpen || dropTarget
                  ? NODE_SHADOW_FILTER_ID_HOVER
                  : NODE_SHADOW_FILTER_ID,
              )}
            />
            {!hasChildren && (
              <text x={x + width / 2} y={y + height / 2} dy="0.35em" textAnchor="middle">
                {t('knative-plugin~No Revisions')}
              </text>
            )}
          </g>
        </Layer>
        {decorators}
        {showLabel && (data.kind || element.getLabel()) && (
          <NodeLabel
            className="pf-topology__group__label odc-knative-service__label odc-base-node__label"
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
        {children}
      </g>
    </Tooltip>
  );
};

export default observer(KnativeServiceGroup);
