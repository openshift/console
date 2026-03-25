import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { css } from '@patternfly/react-styles';
import {
  DEFAULT_LAYER,
  DefaultNode,
  Layer,
  observer,
  ScaleDetailsLevel,
  TOP_LAYER,
  useCombineRefs,
  StatusModifier,
} from '@patternfly/react-topology';
import type { BaseNodeProps } from '@console/dynamic-plugin-sdk/src/extensions/topology-types';
import { useAccessReview } from '@console/internal/components/utils';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import { RESOURCE_NAME_TRUNCATE_LENGTH } from '@console/shared';
import useHover from '../../../../behavior/useHover';
import { useSearchFilter } from '../../../../filters';
import { useShowLabel } from '../../../../filters/useShowLabel';
import { getTopologyResourceObject } from '../../../../utils/topology-utils';
import { getKindStringAndAbbreviation } from './nodeUtils';

import '../../../svg/SvgResourceIcon.scss';
import './BaseNode.scss';

const BaseNode: FC<BaseNodeProps> = ({
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
  createConnectorDrag,
  alertVariant,
  ...rest
}) => {
  const [hoverChange, setHoverChange] = useState<boolean>(false);
  const [hover, internalHoverRef] = useHover(200, 200, [hoverChange]);
  const nodeHoverRefs = useCombineRefs(internalHoverRef, hoverRef);
  // Keep hover active when context menu is open to prevent re-renders
  const isHovering = hover || contextMenuOpen;
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
  const showLabel = useShowLabel(isHovering);
  const kindData = kind && getKindStringAndAbbreviation(kind);

  const detailsLevel = element.getController().getGraph().getDetailsLevel();
  const showDetails = isHovering || detailsLevel !== ScaleDetailsLevel.low;
  const badgeClassName = kindData
    ? css('odc-resource-icon', {
        [`odc-resource-icon-${kindData.kindStr.toLowerCase()}`]: !kindData.kindColor,
      })
    : '';
  useEffect(() => {
    if (!createConnectorDrag) {
      setHoverChange((prev) => !prev);
    }
  }, [createConnectorDrag]);
  return (
    <Layer id={isHovering ? TOP_LAYER : DEFAULT_LAYER}>
      <g ref={nodeHoverRefs} data-test-id={element.getLabel()}>
        <DefaultNode
          className={css('odc-base-node', className, alertVariant && StatusModifier[alertVariant], {
            'is-filtered': filtered,
          })}
          truncateLength={RESOURCE_NAME_TRUNCATE_LENGTH}
          element={element}
          showLabel={showLabel}
          hover={contextMenuOpen ? true : undefined}
          scaleNode={isHovering && detailsLevel !== ScaleDetailsLevel.high}
          onShowCreateConnector={
            editAccess && detailsLevel !== ScaleDetailsLevel.low && onShowCreateConnector
          }
          onContextMenu={onContextMenu}
          contextMenuOpen={contextMenuOpen}
          badge={kindData?.kindAbbr}
          badgeColor={kindData?.kindColor}
          badgeClassName={badgeClassName}
          showStatusBackground={!showDetails}
          raiseLabelOnHover={false}
          {...rest}
        >
          <g data-test-id="base-node-handler">
            {icon && showDetails && (
              <>
                <circle fill="var(--pf-t--color--white)" cx={cx} cy={cy} r={innerRadius + 6} />
                <image
                  x={cx - iconRadius}
                  y={cy - iconRadius}
                  width={iconRadius * 2}
                  height={iconRadius * 2}
                  xlinkHref={icon}
                />
              </>
            )}
            {showDetails && children}
          </g>
        </DefaultNode>
      </g>
    </Layer>
  );
};

export default observer(BaseNode);
