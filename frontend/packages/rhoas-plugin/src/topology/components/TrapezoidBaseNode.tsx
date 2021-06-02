import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import {
  Node,
  WithCreateConnectorProps,
  WithDndDropProps,
  WithDragNodeProps,
  WithSelectionProps,
  WithContextMenuProps,
  useCombineRefs,
  useHover,
  observer,
  createSvgIdUrl,
  useSvgAnchor,
} from '@patternfly/react-topology';
import * as classNames from 'classnames';
import { useAccessReview } from '@console/internal/components/utils';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import {
  NodeShadows,
  NODE_SHADOW_FILTER_ID_HOVER,
  NODE_SHADOW_FILTER_ID,
} from '@console/topology/src/components/graph-view';
import SvgBoxedText from '@console/topology/src/components/svg/SvgBoxedText';
import {
  getFilterById,
  useDisplayFilters,
  useSearchFilter,
  useAllowEdgeCreation,
  SHOW_LABELS_FILTER_ID,
} from '@console/topology/src/filters';
import { getTopologyResourceObject } from '@console/topology/src/utils/topology-utils';

import './TrapezoidBaseNode.scss';

type TrapezoidBaseNodeProps = {
  className: string;
  outerRadius: number;
  innerRadius?: number;
  icon?: string;
  kind?: string;
  children?: React.ReactNode;
  attachments?: React.ReactNode;
  element: Node;
  dragging?: boolean;
  edgeDragging?: boolean;
  dropTarget?: boolean;
  canDrop?: boolean;
  tooltipLabel?: string;
} & WithSelectionProps &
  WithDragNodeProps &
  WithDndDropProps &
  WithContextMenuProps &
  WithCreateConnectorProps;

const TrapezoidBaseNode: React.FC<TrapezoidBaseNodeProps> = ({
  className,
  outerRadius,
  innerRadius,
  icon,
  kind,
  element,
  selected,
  onSelect,
  children,
  attachments,
  dragNodeRef,
  dndDropRef,
  canDrop,
  dragging,
  edgeDragging,
  dropTarget,
  onHideCreateConnector,
  onShowCreateConnector,
  onContextMenu,
  contextMenuOpen,
  tooltipLabel,
}) => {
  const [hover, hoverRef] = useHover();
  const anchorRef = useSvgAnchor();
  const { width, height } = element.getDimensions();
  const cx = width / 2;
  const cy = height / 2;
  const resourceObj = getTopologyResourceObject(element.getData());
  const resourceModel = modelFor(referenceFor(resourceObj));
  const iconRadius = innerRadius * 0.9;
  const editAccess = useAccessReview({
    group: resourceModel.apiGroup,
    verb: 'patch',
    resource: resourceModel.plural,
    name: resourceObj.metadata.name,
    namespace: resourceObj.metadata.namespace,
  });
  const [filtered] = useSearchFilter(element.getLabel());
  const displayFilters = useDisplayFilters();
  const showLabelsFilter = getFilterById(SHOW_LABELS_FILTER_ID, displayFilters);
  const showLabels = showLabelsFilter?.value || hover;
  const refs = useCombineRefs<SVGEllipseElement>(hoverRef, dragNodeRef);
  const allowEdgeCreation = useAllowEdgeCreation();
  const pathRefs = useCombineRefs(anchorRef, dndDropRef);

  React.useLayoutEffect(() => {
    if (editAccess && allowEdgeCreation) {
      if (hover) {
        onShowCreateConnector && onShowCreateConnector();
      } else {
        onHideCreateConnector && onHideCreateConnector();
      }
    }
  }, [hover, onShowCreateConnector, onHideCreateConnector, editAccess, allowEdgeCreation]);

  return (
    <Tooltip
      content={tooltipLabel}
      trigger="manual"
      isVisible={dropTarget && canDrop}
      animationDuration={0}
      position="top"
    >
      <g
        className={classNames('rhoas-trapezoid-base-node', className, {
          'is-hover': hover || contextMenuOpen,
          'is-highlight': canDrop,
          'is-dragging': dragging || edgeDragging,
          'is-dropTarget': canDrop && dropTarget,
          'is-filtered': filtered,
          'is-selected': selected,
        })}
      >
        <NodeShadows />
        <g
          data-test-id="base-node-handler"
          onClick={onSelect}
          onContextMenu={onContextMenu}
          ref={refs}
        >
          <path
            d="M23,12h58c4.9-0.1,9.1,3.3,10.2,8l12.6,60c1.1,5.4-2.5,10.7-7.9,11.7c0,0,0,0,0,0l-0.3,0.1
    c-0.7,0.1-1.3,0.2-2,0.2H10.4C4.8,92.1,0.1,87.6,0,82c0-0.7,0.1-1.3,0.2-2l12.5-60C13.8,15.2,18.1,11.9,23,12z"
            key={
              hover || dragging || edgeDragging || dropTarget || contextMenuOpen
                ? 'circle-hover'
                : 'circle'
            }
            className="rhoas-trapezoid-base-node__bg"
            ref={pathRefs}
            cx={cx}
            cy={cy}
            filter={createSvgIdUrl(
              hover || dragging || edgeDragging || dropTarget || contextMenuOpen
                ? NODE_SHADOW_FILTER_ID_HOVER
                : NODE_SHADOW_FILTER_ID,
            )}
          />
          {icon && (
            <image
              x={cx - iconRadius}
              y={cy - iconRadius}
              width={iconRadius * 2}
              height={iconRadius * 2}
              xlinkHref={icon}
            />
          )}
          {showLabels && (kind || element.getLabel()) && (
            <SvgBoxedText
              className="rhoas-trapezoid-base-node__label"
              x={cx}
              y={cy + outerRadius + 24}
              paddingX={8}
              paddingY={4}
              kind={kind}
            >
              {element.getLabel()}
            </SvgBoxedText>
          )}
          {children}
        </g>
        {attachments}
      </g>
    </Tooltip>
  );
};

export default observer(TrapezoidBaseNode);
