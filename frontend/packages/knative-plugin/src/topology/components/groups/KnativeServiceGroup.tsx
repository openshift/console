import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import {
  Node,
  AnchorEnd,
  observer,
  WithSelectionProps,
  WithContextMenuProps,
  WithDndDropProps,
  RectAnchor,
  useAnchor,
  useDragNode,
  Layer,
  useHover,
  createSvgIdUrl,
  useCombineRefs,
  WithCreateConnectorProps,
} from '@patternfly/react-topology';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import {
  NodeShadows,
  NODE_SHADOW_FILTER_ID,
  NODE_SHADOW_FILTER_ID_HOVER,
  nodeDragSourceSpec,
} from '@console/topology/src/components/graph-view';
import { getNodeDecorators } from '@console/topology/src/components/graph-view/components/nodes/decorators/getNodeDecorators';
import SvgBoxedText from '@console/topology/src/components/svg/SvgBoxedText';
import {
  useSearchFilter,
  useDisplayFilters,
  useAllowEdgeCreation,
  getFilterById,
  SHOW_LABELS_FILTER_ID,
} from '@console/topology/src/filters';
import { getResource } from '@console/topology/src/utils/topology-utils';
import { TYPE_KNATIVE_SERVICE, EVENT_MARKER_RADIUS } from '../../const';
import { isServerlessFunction } from '../../knative-topology-utils';
import RevisionTrafficSourceAnchor from '../anchors/RevisionTrafficSourceAnchor';

export type KnativeServiceGroupProps = {
  element: Node;
  highlight?: boolean;
  canDrop?: boolean;
  dropTarget?: boolean;
  edgeDragging?: boolean;
  editAccess?: boolean;
  tooltipLabel?: string;
} & WithSelectionProps &
  WithDndDropProps &
  WithContextMenuProps &
  WithCreateConnectorProps;

const DECORATOR_RADIUS = 13;
const KnativeServiceGroup: React.FC<KnativeServiceGroupProps> = ({
  element,
  selected,
  onSelect,
  onContextMenu,
  contextMenuOpen,
  canDrop,
  dropTarget,
  edgeDragging,
  dndDropRef,
  editAccess,
  tooltipLabel,
  onHideCreateConnector,
  onShowCreateConnector,
}) => {
  const { t } = useTranslation();
  const [hover, hoverRef] = useHover();
  const [innerHover, innerHoverRef] = useHover();
  const dragSpec = React.useMemo(() => nodeDragSourceSpec(TYPE_KNATIVE_SERVICE, true, editAccess), [
    editAccess,
  ]);
  const dragProps = React.useMemo(() => ({ element }), [element]);
  const [{ dragging, regrouping }, dragNodeRef] = useDragNode(dragSpec, dragProps);
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
  useAnchor(React.useCallback((node: Node) => new RectAnchor(node, 1.5 + EVENT_MARKER_RADIUS), []));

  const [filtered] = useSearchFilter(element.getLabel());
  const displayFilters = useDisplayFilters();
  const allowEdgeCreation = useAllowEdgeCreation();
  const showLabelsFilter = getFilterById(SHOW_LABELS_FILTER_ID, displayFilters);
  const showLabels = showLabelsFilter?.value || hover || innerHover;
  const { x, y, width, height } = element.getBounds();

  React.useLayoutEffect(() => {
    if (editAccess && allowEdgeCreation) {
      if (innerHover) {
        onShowCreateConnector && onShowCreateConnector();
      } else {
        onHideCreateConnector && onHideCreateConnector();
      }
    }
  }, [editAccess, innerHover, onShowCreateConnector, onHideCreateConnector, allowEdgeCreation]);

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
          'is-dragging': dragging || labelDragging,
          'is-highlight': canDrop || edgeDragging,
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
              'is-selected': selected,
              'is-dragging': dragging || labelDragging,
              'is-highlight': canDrop || edgeDragging,
              'is-dropTarget': canDrop && dropTarget,
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
        {showLabels && (data.kind || element.getLabel()) && (
          <SvgBoxedText
            className="odc-knative-service__label odc-base-node__label"
            x={x + width / 2}
            y={y + height + 20}
            paddingX={8}
            paddingY={4}
            kind={data.kind}
            dragRef={dragLabelRef}
            typeIconClass={typeIconClass}
          >
            {element.getLabel()}
          </SvgBoxedText>
        )}
      </g>
    </Tooltip>
  );
};

export default observer(KnativeServiceGroup);
