import * as React from 'react';
import * as classNames from 'classnames';
import {
  Node,
  useAnchor,
  EllipseAnchor,
  WithCreateConnectorProps,
  WithDndDropProps,
  WithDragNodeProps,
  WithSelectionProps,
  WithContextMenuProps,
  useCombineRefs,
  useHover,
  observer,
  createSvgIdUrl,
} from '@console/topology';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import { useAccessReview } from '@console/internal/components/utils';
import SvgBoxedText from '../../../svg/SvgBoxedText';
import { getTopologyResourceObject } from '../../topology-utils';
import { useDisplayFilters, useSearchFilter } from '../../filters';
import { NodeShadows, NODE_SHADOW_FILTER_ID_HOVER, NODE_SHADOW_FILTER_ID } from '../NodeShadows';

import './BaseNode.scss';

export type BaseNodeProps = {
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
} & WithSelectionProps &
  WithDragNodeProps &
  WithDndDropProps &
  WithContextMenuProps &
  WithCreateConnectorProps;

const ObservedBaseNode: React.FC<BaseNodeProps> = ({
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
}) => {
  const [hover, hoverRef] = useHover();
  useAnchor(EllipseAnchor);
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
  const showLabels = displayFilters.showLabels || hover;
  const refs = useCombineRefs<SVGEllipseElement>(hoverRef, dragNodeRef);

  React.useLayoutEffect(() => {
    if (editAccess) {
      if (hover) {
        onShowCreateConnector && onShowCreateConnector();
      } else {
        onHideCreateConnector && onHideCreateConnector();
      }
    }
  }, [hover, onShowCreateConnector, onHideCreateConnector, editAccess]);

  return (
    <g
      className={classNames('odc-base-node', {
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
        onContextMenu={editAccess ? onContextMenu : null}
        ref={refs}
      >
        <circle
          className="odc-base-node__bg"
          ref={dndDropRef}
          cx={cx}
          cy={cy}
          r={outerRadius}
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
            className="odc-base-node__label"
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
  );
};

const BaseNode = observer(ObservedBaseNode);
export { BaseNode };
