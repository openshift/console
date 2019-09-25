import * as React from 'react';
import { ChartAxis } from '@patternfly/react-charts';
import { global_breakpoint_sm as breakpointSM } from '@patternfly/react-tokens';

import { useRefWidth } from '../../utils';

const formatDate = (date: Date): string => {
  const minutes = `0${date.getMinutes()}`.slice(-2);
  return `${date.getHours()}:${minutes}`;
};

const UtilizationAxis: React.FC<UtilizationAxisProps> = ({ timestamps }) => {
  const [containerRef, width] = useRefWidth();
  return (
    <div ref={containerRef}>
      <ChartAxis
        scale={{ x: 'time' }}
        tickValues={timestamps}
        tickFormat={formatDate}
        orientation="top"
        height={15}
        width={width}
        padding={{ top: 30, bottom: 0, left: 70, right: 0 }}
        style={{
          axis: {visibility: 'hidden'},
        }}
        fixLabelOverlap
      />
    </div>
  );
};

export const UtilizationBody: React.FC<UtilizationBodyProps> = ({ timestamps, children }) => {
  const [containerRef, width] = useRefWidth();

  const axis = width < parseInt(breakpointSM.value, 10) ?
    timestamps.length === 0 ? null : (
      <div className="row co-utilization-card__item">
        <div className="co-utilization-card__axis">
          <UtilizationAxis timestamps={timestamps} />
        </div>
      </div>
    ) : (
      <div className="row co-utilization-card__item">
        <div className="col-xs-5 col-sm-5 col-md-5 col-lg-5"></div>
        <div className="col-xs-7 col-sm-7 col-md-7 col-lg-7 co-utilization-card__axis">
          {timestamps.length > 0 && <UtilizationAxis timestamps={timestamps} />}
        </div>
      </div>
    );
  return (
    <div
      className="co-dashboard-card__body--top-margin co-dashboard-card__body--no-padding co-utilization-card__body"
      ref={containerRef}
    >
      {axis}
      <div>{children}</div>
    </div>
  );
};

type UtilizationBodyProps = {
  children: React.ReactNode;
  timestamps: Date[];
};

type UtilizationAxisProps = {
  timestamps: Date[];
}
