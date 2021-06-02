import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import {
  Node,
  observer,
  WithCreateConnectorProps,
  WithDragNodeProps,
  WithSelectionProps,
  WithDndDropProps,
  WithContextMenuProps,
} from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import { calculateRadius, usePodsWatcher, PodRCData } from '@console/shared';
import { useDisplayFilters, getFilterById, SHOW_POD_COUNT_FILTER_ID } from '../../../../filters';
import { getTopologyResourceObject } from '../../../../utils/topology-utils';
import BaseNode from './BaseNode';
import { getNodeDecorators } from './decorators/getNodeDecorators';
import PodSet, { podSetInnerRadius } from './PodSet';

import './WorkloadNode.scss';

type WorkloadNodeProps = {
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
    const { t } = useTranslation();
    const { width, height } = element.getDimensions();
    const workloadData = element.getData().data;
    const filters = useDisplayFilters();
    const size = Math.min(width, height);
    const { radius, decoratorRadius } = calculateRadius(size);
    const cx = width / 2;
    const cy = height / 2;
    const tipContent = dropTooltip || t('topology~Create a visual connector');
    const showPodCountFilter = getFilterById(SHOW_POD_COUNT_FILTER_ID, filters);
    const showPodCount = showPodCountFilter?.value ?? false;
    const { decorators } = element.getGraph().getData();
    const nodeDecorators = getNodeDecorators(element, decorators, cx, cy, radius, decoratorRadius);
    const iconImageUrl =
      getImageForIconClass(workloadData.builderImage) ?? workloadData.builderImage;
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
            icon={!showPodCount ? iconImageUrl : undefined}
            kind={workloadData.kind}
            element={element}
            dropTarget={dropTarget}
            canDrop={canDrop}
            {...rest}
            attachments={nodeDecorators}
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
  return (
    <WorkloadPodsNode
      element={element}
      donutStatus={loaded && !loadError ? podData : null}
      {...rest}
    />
  );
});

export { WorkloadNode, WorkloadPodsNode };
