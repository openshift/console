import * as React from 'react';
import { connect } from 'react-redux';
import { calculateRadius } from '@console/shared';
import {
  Node,
  observer,
  WithCreateConnectorProps,
  WithDragNodeProps,
  WithSelectionProps,
  WithDndDropProps,
  WithContextMenuProps,
} from '@console/topology';
import { RootState } from '@console/internal/redux-types';
import { Tooltip, TooltipPosition } from '@patternfly/react-core';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';
import { routeDecoratorIcon } from '../../../import/render-utils';
import { Decorator } from './Decorator';
import PodSet, { podSetInnerRadius } from './PodSet';
import BuildDecorator from './build-decorators/BuildDecorator';
import { BaseNode } from './BaseNode';
import { getCheURL, getEditURL, getServiceBindingStatus } from '../../topology-utils';
import { useDisplayFilters } from '../../filters/useDisplayFilters';

import './WorkloadNode.scss';

interface StateProps {
  serviceBinding: boolean;
  cheURL: string;
}

export type WorkloadNodeProps = {
  element: Node;
  hover?: boolean;
  dragging?: boolean;
  highlight?: boolean;
  canDrop?: boolean;
  dropTarget?: boolean;
  urlAnchorRef?: React.Ref<SVGCircleElement>;
} & WithSelectionProps &
  WithDragNodeProps &
  WithDndDropProps &
  WithContextMenuProps &
  WithCreateConnectorProps &
  StateProps;

const ObservedWorkloadNode: React.FC<WorkloadNodeProps> = ({
  element,
  urlAnchorRef,
  canDrop,
  dropTarget,
  serviceBinding,
  cheURL,
  ...rest
}) => {
  const { width, height } = element.getDimensions();
  const workloadData = element.getData().data;
  const filters = useDisplayFilters();
  const size = Math.min(width, height);
  const { donutStatus, editURL, vcsURI } = workloadData;
  const { radius, decoratorRadius } = calculateRadius(size);
  const cheEnabled = !!cheURL;
  const cx = width / 2;
  const cy = height / 2;
  const editUrl = editURL || getEditURL(vcsURI, cheURL);
  const repoIcon = routeDecoratorIcon(editUrl, decoratorRadius, cheEnabled);
  const tipContent = `Create a ${
    serviceBinding && element.getData().operatorBackedService ? 'binding' : 'visual'
  } connector`;

  return (
    <g>
      <Tooltip
        content={tipContent}
        trigger="manual"
        isVisible={dropTarget && canDrop}
        tippyProps={{ duration: 0, delay: 0 }}
      >
        <BaseNode
          className="odc-workload-node"
          outerRadius={radius}
          innerRadius={podSetInnerRadius(size, donutStatus)}
          icon={!filters.podCount ? workloadData.builderImage : undefined}
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
                  href={workloadData.editUrl}
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
                    <ExternalLinkAltIcon style={{ fontSize: decoratorRadius }} alt="Open URL" />
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
          ]}
        >
          <PodSet size={size} x={cx} y={cy} data={donutStatus} showPodCount={filters.podCount} />
        </BaseNode>
      </Tooltip>
    </g>
  );
};

const mapStateToProps = (state: RootState): StateProps => {
  const consoleLinks = state.UI.get('consoleLinks');
  return {
    cheURL: getCheURL(consoleLinks),
    serviceBinding: getServiceBindingStatus(state),
  };
};

const WorkloadNode = connect(mapStateToProps)(observer(ObservedWorkloadNode));
export { WorkloadNode };
