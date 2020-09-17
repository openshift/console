import * as React from 'react';
import * as _ from 'lodash';
import { ChartDonut, ChartLegend, ChartLabel } from '@patternfly/react-charts';
import { WatchK8sResults } from '@console/internal/components/utils/k8s-watch-hook';
import { ClusterVersionKind } from '@console/internal/module/k8s';
import { InsightsOperator } from './status';
import { riskIcons, colorScale, legendColorScale, riskSorting } from './mappers';

const DataComponent: React.FC<DataComponentProps> = ({ x, y, datum }) => {
  const Icon = riskIcons[datum.id];
  return <Icon x={x} y={y - 5} fill={legendColorScale[datum.id]} />;
};

export const InsightsPopup: React.FC<InsightsPopupProps> = ({ insightsReport, clusterVersion }) => {
  const resource = insightsReport.data;
  const clusterId = _.get(clusterVersion, 'data.spec.clusterID', '');
  const riskEntries = Object.entries(resource.spec).sort(
    ([k1], [k2]) => riskSorting[k1] - riskSorting[k2],
  );

  return (
    <div className="co-status-popup__row">
      <div className="co-status-popup__section">
        Insights identifies and prioritizes risks to security, performance, availability, and
        stability of your clusters.
      </div>
      <div className="co-status-popup__section">
        <div>
          <ChartDonut
            data={riskEntries.map(([k, v]) => ({
              label: `${v} ${k}`,
              x: k,
              y: v,
            }))}
            title={`${Object.values(resource.spec).reduce((acc, cur) => acc + cur, 0)}`}
            subTitle="Total issues"
            legendData={Object.entries(resource.spec).map(([k, v]) => ({ name: `${k}: ${v}` }))}
            legendOrientation="vertical"
            width={300}
            height={150}
            colorScale={colorScale}
            constrainToVisibleArea
            legendPosition="left"
            legendComponent={
              <ChartLegend
                title="Total Risk"
                titleComponent={<ChartLabel style={{ fontWeight: 'bold' }} />}
                data={riskEntries.map(([k, v]) => ({
                  name: `${v} ${k}`,
                  id: k,
                }))}
                dataComponent={<DataComponent />}
              />
            }
            padding={{
              bottom: 20,
              left: 145,
              right: 20, // Adjusted to accommodate legend
              top: 0,
            }}
          />
        </div>
      </div>
      <div className="co-status-popup__section co-status-popup__row">
        <div style={{ fontWeight: 'bold' }}>Fixable issues</div>
        <div>
          <a href={`https://cloud.redhat.com/openshift/details/${clusterId}`}>
            View all in OpenShift Cluster Manager
          </a>
        </div>
      </div>
    </div>
  );
};

export type InsightsPopupProps = WatchK8sResults<{
  insightsReport: InsightsOperator;
  clusterVersion: ClusterVersionKind;
}>;
export type DataComponentProps = {
  x?: number;
  y?: number;
  datum?: {
    id: string;
  };
};

InsightsPopup.displayName = 'InsightsPopup';
