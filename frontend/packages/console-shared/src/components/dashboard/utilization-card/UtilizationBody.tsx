import * as React from 'react';
import { ChartAxis, ChartContainer } from '@patternfly/react-charts';
import { Grid } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { timeFormatter } from '@console/internal/components/utils/datetime';
import { useRefWidth } from '@console/internal/components/utils/ref-width-hook';
import { useUtilizationDuration } from '@console/shared';

import './utilization-card.scss';

const UtilizationAxis: React.FC = () => {
  const [containerRef, width] = useRefWidth();
  const { startDate, endDate } = useUtilizationDuration();

  const { t } = useTranslation();
  return (
    <div ref={containerRef}>
      <ChartAxis
        containerComponent={<ChartContainer title={t('console-shared~time axis')} />}
        scale={{ x: 'time' }}
        domain={{ x: [startDate, endDate] }}
        tickFormat={timeFormatter.format}
        orientation="top"
        height={15}
        width={width}
        padding={{ top: 30, bottom: 0, left: 70, right: 0 }}
        style={{
          axis: { visibility: 'hidden' },
        }}
        fixLabelOverlap
      />
    </div>
  );
};

export const UtilizationBody: React.FC<UtilizationBodyProps> = ({ children }) => {
  const { t } = useTranslation();
  const axis = (
    <div className="co-utilization-card__item">
      <div className="co-utilization-card__item-section co-u-hidden co-u-visible-on-xl">
        <span className="co-utilization-card__item-text" data-test="utilization-card-item-text">
          {t('console-shared~Resource')}
        </span>
        <span className="co-utilization-card__item-text" data-test="utilization-card-item-text">
          {t('console-shared~Usage')}
        </span>
      </div>
      <div className="co-utilization-card__item-chart co-utilization-card__item-chart--times">
        <UtilizationAxis />
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
};
