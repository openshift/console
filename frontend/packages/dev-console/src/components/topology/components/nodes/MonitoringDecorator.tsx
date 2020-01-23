import * as React from 'react';
import { connect } from 'react-redux';
import { Tooltip, TooltipPosition } from '@patternfly/react-core';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';
import { global_warning_color_100 as warningColor } from '@patternfly/react-tokens';
import * as UIActions from '@console/internal/actions/ui';
import { Node, SELECTION_EVENT } from '@console/topology';
import Decorator from './Decorator';

type OwnProps = {
  radius: number;
  x: number;
  y: number;
  element: Node;
};

type PropsFromDispatch = {
  onClick: () => void;
};

type MonitoringDecoratorProps = PropsFromDispatch & OwnProps;

const MonitoringDecorator: React.FC<MonitoringDecoratorProps> = ({
  radius,
  x,
  y,
  element,
  onClick,
}) => {
  return (
    <Tooltip key="monitoring" content="Monitoring" position={TooltipPosition.left}>
      <Decorator
        x={x}
        y={y}
        radius={radius}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
          element
            .getGraph()
            .getController()
            .fireEvent(SELECTION_EVENT, [element.getId()]);
        }}
      >
        <g transform={`translate(-${radius / 2}, -${radius / 2})`}>
          <ExclamationTriangleIcon
            color={warningColor.value}
            style={{ fontSize: radius }}
            alt="Monitoring"
          />
        </g>
      </Decorator>
    </Tooltip>
  );
};

const mapDispatchToProps = (dispatch): PropsFromDispatch => ({
  onClick: () => dispatch(UIActions.selectOverviewDetailsTab('Monitoring')),
});

export default connect<{}, PropsFromDispatch, OwnProps>(
  null,
  mapDispatchToProps,
)(MonitoringDecorator);
