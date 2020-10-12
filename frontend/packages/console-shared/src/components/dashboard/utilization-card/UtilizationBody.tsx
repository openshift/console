import * as React from 'react';
import { ChartAxis } from '@patternfly/react-charts';
import { Grid } from '@patternfly/react-core';
import { useRefWidth } from '@console/internal/components/utils/ref-width-hook';
import { useTranslation } from 'react-i18next';

import './utilization-card.scss';

const formatDate = (date: Date): string => {
  const minutes = `0${date.getMinutes()}`.slice(-2);
  return `${date.getHours()}:${minutes}`;
};

const UtilizationAxis: React.FC<UtilizationAxisProps> = ({ timestamps = [] }) => {
  const [containerRef, width] = useRefWidth();
  return (
    <div ref={containerRef}>
      {!!timestamps.length && (
        <ChartAxis
          scale={{ x: 'time' }}
          domain={{ x: [timestamps[0], timestamps[timestamps.length - 1]] }}
          tickFormat={formatDate}
          orientation="top"
          height={15}
          width={width}
          padding={{ top: 30, bottom: 0, left: 70, right: 0 }}
          style={{
            axis: { visibility: 'hidden' },
          }}
          fixLabelOverlap
        />
      )}
    </div>
  );
};

export const UtilizationBody: React.FC<UtilizationBodyProps> = ({ timestamps, children }) => {
  const { t } = useTranslation();
  const axis = (
    <div className="co-utilization-card__item">
      <div className="co-utilization-card__item-section co-u-hidden co-u-visible-on-xl">
        <span className="co-utilization-card__item-text" data-test="utilization-card-item-text">
          {t('public~Resource')}
        </span>
        <span className="co-utilization-card__item-text" data-test="utilization-card-item-text">
          {t('dashboard~Usage')}
        </span>
      </div>
      <div className="co-utilization-card__item-chart co-utilization-card__item-chart--times">
        <UtilizationAxis timestamps={timestamps} />
      </div>
    </div>
  );

  return (
    <div className="co-utilization-card__body">
      <Grid>
        {axis}
        {children}
      </Grid>
    </div>
  );
};

export default UtilizationBody;

type UtilizationBodyProps = {
  children: React.ReactNode;
  timestamps: Date[];
};

type UtilizationAxisProps = {
  timestamps: Date[];
};
