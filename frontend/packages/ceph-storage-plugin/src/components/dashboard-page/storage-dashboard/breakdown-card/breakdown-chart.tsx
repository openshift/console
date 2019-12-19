import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  Chart,
  ChartAxis,
  ChartBar,
  ChartLabel,
  ChartLegend,
  ChartStack,
  ChartThemeColor,
  ChartTooltip,
} from '@patternfly/react-charts';
import { Tooltip } from '@patternfly/react-core';
import { DataPoint } from '@console/internal/components/graphs';
import { K8sKind, referenceForModel } from '@console/internal/module/k8s';
import { resourcePathFromModel } from '@console/internal/components/utils';
import { CEPH_STORAGE_NAMESPACE } from '@console/ceph-storage-plugin/src/constants';
import { isAvailableBar, getBarRadius, StackDataPoint } from './utils';
import { OTHER, CLUSTERWIDE, BUCKETCLASSKIND } from './consts';
import './breakdown-card.scss';

const LinkableLegend: React.FC<LinkableLegendProps> = React.memo((props: LinkableLegendProps) => {
  const { metricModel, datum, ocsVersion } = props;
  let href: string = resourcePathFromModel(metricModel, datum.link, CEPH_STORAGE_NAMESPACE);
  const style = {};
  const customLegend = (
    <Tooltip content={datum.link} enableFlip>
      <ChartLabel
        {...props}
        lineHeight={1.2}
        style={[{ ...datum.labels, fontSize: 9 }, { fill: 'black', fontSize: 8 }]}
      />
    </Tooltip>
  );
  if (datum.name[0] === OTHER || datum.name[0] === CLUSTERWIDE) {
    return customLegend;
  }
  if (metricModel.kind === BUCKETCLASSKIND) {
    if (ocsVersion) {
      href = `/k8s/ns/${CEPH_STORAGE_NAMESPACE}/clusterserviceversions/${ocsVersion}/${referenceForModel(
        metricModel,
      )}/${datum.link}`;
    } else {
      return customLegend;
    }
  }
  return (
    <Link to={href} style={style} className="capacity-breakdown-card__legend-link">
      {customLegend}
    </Link>
  );
});

export const BreakdownChart: React.FC<BreakdownChartProps> = ({
  data,
  legends,
  metricModel,
  ocsVersion,
}) => {
  const chartData = data.map((d: StackDataPoint, index) => (
    <ChartBar
      key={d.id}
      style={{ data: { stroke: 'white', strokeWidth: 0.7, ...isAvailableBar(d.name) } }}
      cornerRadius={getBarRadius(index, data.length)}
      barWidth={18}
      padding={0}
      data={[d]}
      labelComponent={<ChartTooltip dx={0} style={{ fontSize: 8, padding: 5 }} />}
    />
  ));

  return (
    <>
      <Chart
        legendPosition="bottom-left"
        legendComponent={
          <ChartLegend
            themeColor={ChartThemeColor.multiOrdered}
            data={legends}
            y={40}
            labelComponent={<LinkableLegend metricModel={metricModel} ocsVersion={ocsVersion} />}
            orientation="horizontal"
            symbolSpacer={7}
            gutter={10}
            height={50}
            style={{ labels: { fontSize: 8 } }}
          />
        }
        height={60}
        padding={{
          bottom: 35,
          top: 0,
          right: 0,
          left: 0,
        }}
        themeColor={ChartThemeColor.multiOrdered}
      >
        <ChartAxis
          style={{ axis: { stroke: 'none' }, ticks: { stroke: 'none' } }}
          tickFormat={() => ''}
        />
        <ChartStack horizontal>{chartData}</ChartStack>
      </Chart>
    </>
  );
};

type BreakdownChartProps = {
  data: DataPoint[];
  legends: any[]; // TBD(afreen23): pass down normal legends
  metricModel: K8sKind;
  ocsVersion?: string;
};

type LinkableLegendProps = {
  metricModel: K8sKind;
  datum?: any;
  ocsVersion?: string;
};
