import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { calculateRadius } from '@console/shared';
import {
  Node,
  observer,
  WithCreateConnectorProps,
  WithDragNodeProps,
  WithSelectionProps,
  WithDndDropProps,
  WithContextMenuProps,
} from '@patternfly/react-topology';
import { Tooltip, TooltipPosition } from '@patternfly/react-core';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ConsoleLinkModel } from '@console/internal/models';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { routeDecoratorIcon } from '../../../import/render-utils';
import { Decorator } from './Decorator';
import PodSet, { podSetInnerRadius } from './PodSet';
import BuildDecorator from './build-decorators/BuildDecorator';
import { BaseNode } from './BaseNode';
import { getCheURL, getEditURL } from '../../topology-utils';
import { useDisplayFilters, getFilterById, SHOW_POD_COUNT_FILTER_ID } from '../../filters';
import MonitoringAlertsDecorator from './MonitoringAlertsDecorator';
import './WorkloadNode.scss';

export type WorkloadNodeProps = {
  element: Node;
  hover?: boolean;
  dragging?: boolean;
  highlight?: boolean;
  canDrop?: boolean;
  dropTarget?: boolean;
  urlAnchorRef?: React.Ref<SVGCircleElement>;
  dropTooltip?: React.ReactNode;
} & WithSelectionProps &
  WithDragNodeProps &
  WithDndDropProps &
  WithContextMenuProps &
  WithCreateConnectorProps;

const ObservedWorkloadNode: React.FC<WorkloadNodeProps> = ({
  element,
  urlAnchorRef,
  canDrop,
  dropTarget,
  dropTooltip,
  ...rest
}) => {
  const { t } = useTranslation();
  const [consoleLinks] = useK8sWatchResource<K8sResourceKind[]>({
    isList: true,
    kind: referenceForModel(ConsoleLinkModel),
    optional: true,
  });
  const cheURL = getCheURL(consoleLinks);
  const { width, height } = element.getDimensions();
  const workloadData = element.getData().data;
  const filters = useDisplayFilters();
  const size = Math.min(width, height);
  const { donutStatus, editURL, vcsURI, vcsRef } = workloadData;
  const { radius, decoratorRadius } = calculateRadius(size);
  const cheEnabled = !!cheURL;
  const cx = width / 2;
  const cy = height / 2;
  const editUrl = editURL || getEditURL(vcsURI, vcsRef, cheURL);
  const repoIcon = routeDecoratorIcon(editUrl, decoratorRadius, t, cheEnabled);
  const tipContent = dropTooltip || t('devconsole~Create a visual connector');
  const showPodCountFilter = getFilterById(SHOW_POD_COUNT_FILTER_ID, filters);
  const showPodCount = showPodCountFilter?.value ?? false;

  return (
    <g>
      <Tooltip
        content={tipContent}
        trigger="manual"
        isVisible={dropTarget && canDrop}
        animationDuration={0}
      >
        <BaseNode
          className="odc-workload-node"
          outerRadius={radius}
          innerRadius={podSetInnerRadius(size, donutStatus)}
          icon={!showPodCount ? workloadData.builderImage : undefined}
          kind={workloadData.kind}
          element={element}
          dropTarget={dropTarget}
          canDrop={canDrop}
          {...rest}
          attachments={[
            repoIcon && (
              <Tooltip
                key="edit"
                content={t('devconsole~Edit Source Code')}
                position={TooltipPosition.right}
              >
                <Decorator
                  x={cx + radius - decoratorRadius * 0.7}
                  y={cy + radius - decoratorRadius * 0.7}
                  radius={decoratorRadius}
                  href={editUrl}
                  external
                >
                  <g transform={`translate(-${decoratorRadius / 2}, -${decoratorRadius / 2})`}>
                    {repoIcon}
                  </g>
                </Decorator>
              </Tooltip>
            ),
            workloadData.url && (
              <Tooltip
                key="route"
                content={t('devconsole~Open URL')}
                position={TooltipPosition.right}
              >
                <Decorator
                  x={cx + radius - decoratorRadius * 0.7}
                  y={cy + -radius + decoratorRadius * 0.7}
                  radius={decoratorRadius}
                  href={workloadData.url}
                  external
                  circleRef={urlAnchorRef}
                >
                  <g transform={`translate(-${decoratorRadius / 2}, -${decoratorRadius / 2})`}>
                    <ExternalLinkAltIcon
                      style={{ fontSize: decoratorRadius }}
                      title={t('devconsole~Open URL')}
                    />
                  </g>
                </Decorator>
              </Tooltip>
            ),
            <BuildDecorator
              key="build"
              workloadData={workloadData}
              x={cx - radius + decoratorRadius * 0.7}
              y={cy + radius - decoratorRadius * 0.7}
              radius={decoratorRadius}
            />,
            <MonitoringAlertsDecorator
              key="monitoringAlert"
              monitoringAlerts={workloadData.monitoringAlerts}
              workload={element}
              x={cx - radius + decoratorRadius * 0.7}
              y={cy - radius + decoratorRadius * 0.7}
              radius={decoratorRadius}
            />,
          ]}
        >
          <PodSet size={size} x={cx} y={cy} data={donutStatus} showPodCount={showPodCount} />
        </BaseNode>
      </Tooltip>
    </g>
  );
};

const WorkloadNode = observer(ObservedWorkloadNode);
export { WorkloadNode };
