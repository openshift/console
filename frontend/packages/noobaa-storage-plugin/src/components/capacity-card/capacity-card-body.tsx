import * as React from 'react';
import { ChartDonut, ChartThemeVariant, ChartThemeColor } from '@patternfly/react-charts';
import { DataPoint } from '@console/internal/components/graphs';
import { GraphEmpty } from '@console/internal/components/graphs/graph-empty';
import {
  LoadingInline,
  humanizePercentage,
  humanizeBinaryBytesWithoutB,
} from '@console/internal/components/utils';
import './capacity-card.scss';

type LegendDataType = {
  name: string;
};

// as per the noobaa spec,
// a. sort it in descending order and pick the top 6 items (excluding 'Others' label)
// b. append the 'Others' label
// PS: 'metricData' argument passed to this function will be in sorted form and
//     with 'Others' label appended to it
const getLegendAndChartData = (
  metricData: DataPoint[],
  total: number,
): {
  metricData: DataPoint[];
  metricLegend: LegendDataType[];
} => {
  const metricLegend: LegendDataType[] = [];

  // if there is no data, return the empty values
  if (!metricData || !metricData.length) {
    return { metricData, metricLegend };
  }
  // get the percentage
  metricData.forEach((m) => {
    metricLegend.push({ name: `${m.x}` });
    m.y = total ? (m.y / total) * 100 : 100;
  });
  return { metricData, metricLegend };
};

export const CapacityCardBody: React.FC<CapacityCardBodyProps> = ({
  isLoading,
  metricsData,
  totalUsage,
  error,
}) => {
  if (error) {
    return <GraphEmpty />;
  }
  if (isLoading) {
    return <LoadingInline />;
  }
  const { metricData, metricLegend } = getLegendAndChartData(metricsData, totalUsage);
  if (!metricData.length) {
    return <GraphEmpty />;
  }
  const totalHumanized = humanizeBinaryBytesWithoutB(totalUsage, null, totalUsage ? null : 'MiB');
  return (
    <div className="nb-capacity-card__body-chart">
      <div className="noobaa-capacity-card__item">
        <ChartDonut
          width={275}
          height={150}
          labelPosition="centroid"
          legendPosition="right"
          legendData={metricLegend}
          legendOrientation="vertical"
          data={metricData}
          labels={(datum) => `${datum.x}: ${humanizePercentage(totalUsage ? datum.y : 0).string}`}
          themeColor={ChartThemeColor.multi}
          themeVariant={ChartThemeVariant.light}
          title={totalHumanized.string}
        />
      </div>
    </div>
  );
};

type CapacityCardBodyProps = {
  isLoading: boolean;
  metricsData: DataPoint[];
  totalUsage: number;
  error: boolean;
};
