import * as React from 'react';
import {
  BadgeLocation,
  DefaultNode,
  Node,
  observer,
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
  dragging?: boolean;
  dropTarget?: boolean;
  canDrop?: boolean;
  createConnectorAccessVerb?: K8sVerb;
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
  children,
  dragNodeRef,
  onShowCreateConnector,
  onContextMenu,
  contextMenuOpen,
  createConnectorAccessVerb = 'patch',
  ...rest
}) => {
  const [hover, hoverRef] = useHover();
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
  const refs = useCombineRefs<SVGEllipseElement>(hoverRef, dragNodeRef);
  const showLabel = useShowLabel(hover);
  const kindData = kind && getKindStringAndAbbreviation(kind);

  const badgeClassName = kindData
    ? classNames('odc-resource-icon', {
        [`odc-resource-icon-${kindData.kindStr.toLowerCase()}`]: !kindData.kindColor,
      })
    : '';

  return (
    <DefaultNode
      className={classNames('odc-base-node', className, {
        'is-filtered': filtered,
      })}
      truncateLength={RESOURCE_NAME_TRUNCATE_LENGTH}
      element={element}
      showLabel={showLabel}
      onShowCreateConnector={editAccess && onShowCreateConnector}
      onContextMenu={onContextMenu}
      contextMenuOpen={contextMenuOpen}
      dragNodeRef={refs}
      badge={kindData?.kindAbbr}
      badgeColor={kindData?.kindColor}
      badgeClassName={badgeClassName}
      {...rest}
    >
      <g data-test-id="base-node-handler">
        {icon && (
          <image
            x={cx - iconRadius}
            y={cy - iconRadius}
            width={iconRadius * 2}
            height={iconRadius * 2}
            xlinkHref={icon}
          />
        )}
        {children}
      </g>
    </DefaultNode>
  );
};

export default observer(BaseNode);
