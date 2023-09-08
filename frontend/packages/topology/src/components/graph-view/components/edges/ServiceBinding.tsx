import * as React from 'react';
import { css } from '@patternfly/react-styles';
import {
  Edge,
  EdgeTerminalType,
  NodeStatus,
  StatusModifier,
  observer,
  WithSourceDragProps,
  WithTargetDragProps,
  WithContextMenuProps,
} from '@patternfly/react-topology';
import styles from '@patternfly/react-topology/src/css/topology-components';
import { ComputedServiceBindingStatus } from '@console/service-binding-plugin/src/types';
import { getComputedServiceBindingStatus } from '@console/service-binding-plugin/src/utils';
import BaseEdge from './BaseEdge';

import './ServiceBinding.scss';

const ERROR_CROSS_SIZE = 8;
const ERROR_CROSS_STROKE_WIDTH = 2;

type ServiceBindingProps = {
  element: Edge;
  dragging?: boolean;
} & WithSourceDragProps &
  WithTargetDragProps &
  WithContextMenuProps;

const ServiceBinding: React.FC<ServiceBindingProps> = (props) => {
  const { sbr } = props.element.getData();

  const hasError = getComputedServiceBindingStatus(sbr) === ComputedServiceBindingStatus.ERROR;

  let errorCross: JSX.Element;
  if (hasError) {
    const startPoint = props.element.getStartPoint();
    const endPoint = props.element.getEndPoint();
    const centerX = (startPoint.x + endPoint.x) / 2;
    const centerY = (startPoint.y + endPoint.y) / 2;
    const angleDeg =
      Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x) * (180 / Math.PI);

    const classNames = css(
      // required to make it red
      styles.topologyEdge,
      StatusModifier[NodeStatus.danger],
      // required to make it blue when the edge is selected
      styles.topologyConnectorArrow,
    );

    errorCross = (
      <g transform={`translate(${centerX}, ${centerY}) rotate(${angleDeg})`} className={classNames}>
        <line
          x1={-ERROR_CROSS_SIZE}
          y1={-ERROR_CROSS_SIZE}
          x2={ERROR_CROSS_SIZE}
          y2={ERROR_CROSS_SIZE}
          strokeWidth={ERROR_CROSS_STROKE_WIDTH}
        />
        <line
          x1={-ERROR_CROSS_SIZE}
          y1={ERROR_CROSS_SIZE}
          x2={ERROR_CROSS_SIZE}
          y2={-ERROR_CROSS_SIZE}
          strokeWidth={ERROR_CROSS_STROKE_WIDTH}
        />
      </g>
    );
  }

  return (
    <BaseEdge
      className="odc-service-binding"
      endTerminalStatus={hasError ? NodeStatus.danger : undefined}
      endTerminalType={EdgeTerminalType.directional}
      {...props}
    >
      {errorCross}
    </BaseEdge>
  );
};

export default observer(ServiceBinding);
