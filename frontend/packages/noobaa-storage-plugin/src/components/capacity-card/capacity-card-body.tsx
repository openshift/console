import * as React from 'react';
import * as _ from 'lodash';
import { ChartDonut, ChartThemeVariant, ChartThemeColor } from '@patternfly/react-charts';
import { ChartPieIcon } from '@patternfly/react-icons';
import { DataPoint } from '@console/internal/components/graphs';
import { LoadingInline, humanizeBinaryBytesWithoutB } from '@console/internal/components/utils';
import { GraphEmpty } from '@console/internal/components/graphs/graph-empty';

type MetricDataType = {
  x: string;
  y: number;
};

type LegendDataType = {
  name: string;
};

// as per the noobaa spec,
// a. omit 'Others' label
// b. sort it in descending order
// c. collect the first 'N' items
// d. rest of the miscs data should be aggregated
//    into 'Others' label,
// and separating Data and Legend array from DataPoint
const getMetricDataAndLegend = (
  metricDataPoint: DataPoint[],
  maxSize: number = 6,
): {
  metricData: MetricDataType[];
  metricLegend: LegendDataType[];
  total: number;
} => {
  let metricData: MetricDataType[] = [];
  const metricLegend: LegendDataType[] = [];
  let total = 0;

  if (!metricDataPoint || !metricDataPoint.length) {
    return { metricData, metricLegend, total };
  }
  metricDataPoint.forEach((mDP) => {
    const tmpMetricData: MetricDataType = { x: `${mDP.x}`, y: Number(mDP.y) };
    // skip 'Others' label
    if (tmpMetricData.x === 'Others') return;
    total += tmpMetricData.y;
    metricData.push(tmpMetricData);
  });
  metricData = _.sortBy(metricData, ['y']).reverse();
  // collect the other data
  const extraData = metricData.splice(maxSize, metricData.length);
  // if there are any extra / other items, reduce it to a single entry
  if (extraData.length) {
    const otherData = extraData.reduce((prev, curr) => {
      return { x: 'Others', y: prev.y + curr.y };
    });
    metricData.push(otherData);
  }
  metricData = metricData.map((m) => {
    metricLegend.push({ name: m.x });
    return { x: m.x, y: (m.y / total) * 100 };
  });
  return { metricData, metricLegend, total };
};

export const CapacityCardBody: React.FC<CapacityCardBodyProps> = ({ isLoading, metricsData }) => {
  if (isLoading) {
    return <LoadingInline />;
  }
  // trying to avoid redundant code
  const { metricData, metricLegend, total } = getMetricDataAndLegend(metricsData);
  if (!metricData.length) {
    return <GraphEmpty icon={ChartPieIcon} />;
  }
  return (
    <div>
      <span className="text-secondary">
        <h4>Usage Breakdown</h4>
      </span>
      <ChartDonut
        donutHeight={250}
        donutWidth={110}
        labelPosition="startAngle"
        legendPosition="right"
        legendData={metricLegend}
        legendOrientation="vertical"
        data={metricData}
        labels={(datum) => `${datum.x}: ${datum.y.toFixed(2)}%`}
        subTitlePosition="bottom"
        themeColor={ChartThemeColor.multi}
        themeVariant={ChartThemeVariant.light}
        title={humanizeBinaryBytesWithoutB(total).string}
        radius={53}
        innerRadius={46}
      />
    </div>
  );
};

type CapacityCardBodyProps = {
  isLoading: boolean;
  metricsData: DataPoint[];
};
