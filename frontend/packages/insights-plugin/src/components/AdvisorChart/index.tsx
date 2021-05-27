import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ChartDonut, ChartLabel, ChartLegend } from '@patternfly/react-charts';
import { global_Color_dark_200 as globalColorDark200 } from '@patternfly/react-tokens';

import {
  AdvisorChartTitle,
  AdvisorChartLegendIcon,
  chartColorScale,
  riskLabels,
} from './chartHelpers';

const AdvisorChart = ({ metrics, clusterId }) => {
  const { t } = useTranslation();

  const issues = Object.entries(metrics);
  const issuesCount = Object.values(metrics).reduce<number>(
    (acc: number, cur: number) => acc + cur,
    0,
  );

  return (
    <ChartDonut
      data={issues.map(([k, v]) => ({
        label: `${v} ${t(riskLabels[k])}`,
        x: k,
        y: v,
      }))}
      title={`${issuesCount}`}
      subTitle={
        issuesCount === 1
          ? t('insights-plugin~Total issue', { count: issuesCount })
          : t('insights-plugin~Total issues', { count: issuesCount })
      }
      subTitleComponent={<ChartLabel style={{ marginTop: 5, fill: globalColorDark200.value }} />}
      legendData={Object.entries(metrics).map(([k, v]) => ({ name: `${k}: ${v}` }))}
      width={300}
      height={150}
      colorScale={chartColorScale}
      legendComponent={
        <ChartLegend
          data={issues.map(([k, v]) => ({
            name: `${v} ${t(riskLabels[k])}`,
            id: k,
          }))}
          labelComponent={<AdvisorChartTitle clusterId={clusterId} />}
          dataComponent={<AdvisorChartLegendIcon />}
          title={t('insights-plugin~Total Risk')}
          titleComponent={<ChartLabel style={{ fontWeight: 'bold' }} />}
          x={0}
          orientation="vertical"
          rowGutter={-5}
        />
      }
      padding={{
        bottom: 0,
        left: 150,
        right: 0, // Adjusted to accommodate legend
        top: 0,
      }}
    />
  );
};

export default AdvisorChart;
