import * as React from 'react';
import { ChartDonut, ChartLegend, ChartLabel } from '@patternfly/react-charts';
import { riskIcons, colorScale, legendColorScale, riskSorting, mapMetrics } from './mappers';
import { PrometheusHealthPopupProps } from '@console/plugin-sdk';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { ExternalLink } from '@console/internal/components/utils';
import './style.scss';

const DataComponent: React.FC<DataComponentProps> = ({ x, y, datum }) => {
  const Icon = riskIcons[datum.id];
  return <Icon x={x} y={y - 5} fill={legendColorScale[datum.id]} />;
};

export const InsightsPopup: React.FC<PrometheusHealthPopupProps> = ({ responses, k8sResult }) => {
  const resource = mapMetrics(responses[0].response);
  const clusterID = (k8sResult as K8sResourceKind)?.data?.spec?.clusterID || '';
  const riskEntries = Object.entries(resource).sort(
    ([k1], [k2]) => riskSorting[k1] - riskSorting[k2],
  );
  const numberOfIssues = Object.values(resource).reduce((acc, cur) => acc + cur, 0);
  const hasIssues = riskEntries.length > 0 && numberOfIssues > 0;

  return (
    <div className="co-insights__box">
      <div className="co-status-popup__section">
        Insights identifies and prioritizes risks to security, performance, availability, and
        stability of your clusters.
      </div>
      <div className="co-status-popup__section">
        {hasIssues && (
          <div>
            <ChartDonut
              data={riskEntries.map(([k, v]) => ({
                label: `${v} ${k}`,
                x: k,
                y: v,
              }))}
              title={`${numberOfIssues}`}
              subTitle="Total issues"
              legendData={Object.entries(resource).map(([k, v]) => ({ name: `${k}: ${v}` }))}
              legendOrientation="vertical"
              width={304}
              height={152}
              colorScale={colorScale}
              constrainToVisibleArea
              legendComponent={
                <ChartLegend
                  title="Total Risk"
                  titleComponent={
                    <ChartLabel dx={13} style={{ fontWeight: 'bold', fontSize: '14px' }} />
                  }
                  data={riskEntries.map(([k, v]) => ({
                    name: `${v} ${k}`,
                    id: k,
                  }))}
                  dataComponent={<DataComponent />}
                  x={-13}
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
        )}
        {!hasIssues && <div className="co-insights__no-rules">No Insights data to display.</div>}
      </div>
      <div className="co-status-popup__section">
        {hasIssues && (
          <>
            <h6 className="pf-c-title pf-m-md">Fixable issues</h6>
            <div>
              <ExternalLink
                href={`https://cloud.redhat.com/openshift/details/${clusterID}`}
                text="View all in OpenShift Cluster Manager"
              />
            </div>
          </>
        )}
        {!hasIssues && (
          <ExternalLink
            href="https://docs.openshift.com/container-platform/latest/support/getting-support.html"
            text="More about Insights"
          />
        )}
      </div>
    </div>
  );
};

export type DataComponentProps = {
  x?: number;
  y?: number;
  datum?: {
    id: string;
  };
};

InsightsPopup.displayName = 'InsightsPopup';
