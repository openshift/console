import * as React from 'react';
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
import { calculateRadius, usePodsWatcher, PodRCData } from '@console/shared';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ConsoleLinkModel } from '@console/internal/models';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { routeDecoratorIcon } from '../../../import/render-utils';
import { Decorator } from './Decorator';
import PodSet, { podSetInnerRadius } from './PodSet';
import BuildDecorator from './build-decorators/BuildDecorator';
import { BaseNode } from './BaseNode';
import { getCheURL, getEditURL, getTopologyResourceObject } from '../../topology-utils';
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

type WorkloadPodsNodeProps = WorkloadNodeProps & {
  donutStatus: PodRCData;
};

const WorkloadPodsNode: React.FC<WorkloadPodsNodeProps> = observer(
  ({ donutStatus, element, urlAnchorRef, canDrop, dropTarget, dropTooltip, ...rest }) => {
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
    const { editURL, vcsURI, vcsRef } = workloadData;
    const { radius, decoratorRadius } = calculateRadius(size);
    const cheEnabled = !!cheURL;
    const cx = width / 2;
    const cy = height / 2;
    const editUrl = editURL || getEditURL(vcsURI, vcsRef, cheURL);
    const repoIcon = routeDecoratorIcon(editUrl, decoratorRadius, cheEnabled);
    const tipContent = dropTooltip || `Create a visual connector`;
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
            innerRadius={donutStatus ? podSetInnerRadius(size, donutStatus) : 0}
            icon={!showPodCount ? workloadData.builderImage : undefined}
            kind={workloadData.kind}
            element={element}
            dropTarget={dropTarget}
            canDrop={canDrop}
            {...rest}
            attachments={[
              repoIcon && (
                <Tooltip key="edit" content="Edit Source Code" position={TooltipPosition.right}>
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
                <Tooltip key="route" content="Open URL" position={TooltipPosition.right}>
                  <Decorator
                    x={cx + radius - decoratorRadius * 0.7}
                    y={cy + -radius + decoratorRadius * 0.7}
                    radius={decoratorRadius}
                    href={workloadData.url}
                    external
                    circleRef={urlAnchorRef}
                  >
                    <g transform={`translate(-${decoratorRadius / 2}, -${decoratorRadius / 2})`}>
                      <ExternalLinkAltIcon style={{ fontSize: decoratorRadius }} title="Open URL" />
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
            {donutStatus ? (
              <PodSet size={size} x={cx} y={cy} data={donutStatus} showPodCount={showPodCount} />
            ) : null}
          </BaseNode>
        </Tooltip>
      </g>
    );
  },
);

const WorkloadNode: React.FC<WorkloadNodeProps> = observer(({ element, ...rest }) => {
  const resource = getTopologyResourceObject(element.getData());
  const { podData, loadError, loaded } = usePodsWatcher(
    resource,
    resource.kind,
    resource.metadata.namespace,
  );
  const donutStatus: PodRCData = React.useMemo(() => {
    if (!loadError && loaded) {
      return podData;
    }
    return null;
  }, [loadError, loaded, podData]);

  return <WorkloadPodsNode element={element} donutStatus={donutStatus} {...rest} />;
});

export { WorkloadNode, WorkloadPodsNode };
