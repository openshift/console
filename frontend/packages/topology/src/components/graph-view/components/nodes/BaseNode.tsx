import * as React from 'react';
import {
  BadgeLocation,
  DEFAULT_LAYER,
  DefaultNode,
  Layer,
  Node,
  NodeStatus,
  observer,
  ScaleDetailsLevel,
  TOP_LAYER,
  useCombineRefs,
  useHover,
  WithContextMenuProps,
  WithCreateConnectorProps,
  WithDndDropProps,
  WithDragNodeProps,
  WithSelectionProps,
} from '@patternfly/react-topology';
import classNames from 'classnames';
import { useAccessReview } from '@console/internal/components/utils';
import { K8sVerb, modelFor, referenceFor } from '@console/internal/module/k8s';
import { RESOURCE_NAME_TRUNCATE_LENGTH } from '@console/shared';
import { useSearchFilter } from '../../../../filters';
import { useShowLabel } from '../../../../filters/useShowLabel';
import { getTopologyResourceObject } from '../../../../utils/topology-utils';
import { getKindStringAndAbbreviation } from './nodeUtils';

import '../../../svg/SvgResourceIcon.scss';
import './BaseNode.scss';

type BaseNodeProps = {
  className?: string;
  innerRadius?: number;
  icon?: string;
  kind?: string;
  labelIconClass?: string; // Icon to show in label
  labelIcon?: React.ReactNode;
  labelIconPadding?: number;
  badge?: string;
  badgeColor?: string;
  badgeTextColor?: string;
  badgeBorderColor?: string;
  badgeClassName?: string;
  badgeLocation?: BadgeLocation;
  children?: React.ReactNode;
  attachments?: React.ReactNode;
  element: Node;
  hoverRef?: (node: Element) => () => void;
  dragging?: boolean;
  dropTarget?: boolean;
  canDrop?: boolean;
  createConnectorAccessVerb?: K8sVerb;
  nodeStatus?: NodeStatus;
  showStatusBackground?: boolean;
} & Partial<WithSelectionProps> &
  Partial<WithDragNodeProps> &
  Partial<WithDndDropProps> &
  Partial<WithContextMenuProps> &
  Partial<WithCreateConnectorProps>;

const BaseNode: React.FC<BaseNodeProps> = ({
  className,
  innerRadius,
  icon,
  kind,
  element,
  hoverRef,
  children,
  onShowCreateConnector,
  onContextMenu,
  contextMenuOpen,
  createConnectorAccessVerb = 'patch',
  ...rest
}) => {
  const [hover, internalHoverRef] = useHover();
  const nodeHoverRefs = useCombineRefs(internalHoverRef, hoverRef);
  const { width, height } = element.getDimensions();
  const cx = width / 2;
  const cy = height / 2;
  const resourceObj = getTopologyResourceObject(element.getData());
  const resourceModel = modelFor(referenceFor(resourceObj));
  const iconRadius = innerRadius * 0.9;
  const editAccess = useAccessReview({
    group: resourceModel?.apiGroup,
    verb: createConnectorAccessVerb,
    resource: resourceModel?.plural,
    name: resourceObj.metadata.name,
    namespace: resourceObj.metadata.namespace,
  });
  const [filtered] = useSearchFilter(element.getLabel(), resourceObj?.metadata?.labels);
  const showLabel = useShowLabel(hover || contextMenuOpen);
  const kindData = kind && getKindStringAndAbbreviation(kind);

  const detailsLevel = element
    .getController()
    .getGraph()
    .getDetailsLevel();
  const showDetails = hover || contextMenuOpen || detailsLevel !== ScaleDetailsLevel.low;
  const badgeClassName = kindData
    ? classNames('odc-resource-icon', {
        [`odc-resource-icon-${kindData.kindStr.toLowerCase()}`]: !kindData.kindColor,
      })
    : '';

  return (
    <Layer id={hover || contextMenuOpen ? TOP_LAYER : DEFAULT_LAYER}>
      <g ref={nodeHoverRefs}>
        <DefaultNode
          className={classNames('odc-base-node', className, {
            'is-filtered': filtered,
          })}
          truncateLength={RESOURCE_NAME_TRUNCATE_LENGTH}
          element={element}
          showLabel={showLabel}
          scaleLabel={detailsLevel !== ScaleDetailsLevel.high}
          scaleNode={(hover || contextMenuOpen) && detailsLevel !== ScaleDetailsLevel.high}
          onShowCreateConnector={
            editAccess && detailsLevel !== ScaleDetailsLevel.low && onShowCreateConnector
          }
          onContextMenu={onContextMenu}
          contextMenuOpen={contextMenuOpen}
          badge={kindData?.kindAbbr}
          badgeColor={kindData?.kindColor}
          badgeClassName={badgeClassName}
          showStatusBackground={!showDetails}
          {...rest}
        >
          <g data-test-id="base-node-handler">
            {icon && showDetails && (
              <image
                x={cx - iconRadius}
                y={cy - iconRadius}
                width={iconRadius * 2}
                height={iconRadius * 2}
                xlinkHref={icon}
              />
            )}
            {showDetails && children}
          </g>
        </DefaultNode>
      </g>
    </Layer>
  );
};

export default observer(BaseNode);
