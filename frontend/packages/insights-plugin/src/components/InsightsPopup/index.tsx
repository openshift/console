import * as React from 'react';
import { ChartDonut, ChartLegend, ChartLabel } from '@patternfly/react-charts';
import { Stack, StackItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ExternalLink, isUpstream, openshiftHelpBase } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { PrometheusHealthPopupProps } from '@console/plugin-sdk';
import {
  riskIcons,
  colorScale,
  legendColorScale,
  riskSorting,
  mapMetrics,
  isWaiting,
  isDisabled,
  isError,
} from './mappers';
import './style.scss';

const DataComponent: React.FC<DataComponentProps> = ({ x, y, datum }) => {
  const Icon = riskIcons[datum.id];
  return <Icon x={x} y={y - 5} fill={legendColorScale[datum.id]} />;
};

export const InsightsPopup: React.FC<PrometheusHealthPopupProps> = ({ responses, k8sResult }) => {
  const [
    { response: metricsResponse, error: metricsError },
    { response: operatorStatusResponse, error: operatorStatusError },
  ] = responses;
  const { t } = useTranslation();
  const metrics = mapMetrics(metricsResponse);
  const clusterID = (k8sResult as K8sResourceKind)?.data?.spec?.clusterID || '';
  const riskEntries = Object.entries(metrics).sort(
    ([k1], [k2]) => riskSorting[k1] - riskSorting[k2],
  );
  const numberOfIssues = Object.values(metrics).reduce((acc, cur) => acc + cur, 0);
  const waiting = isWaiting(metrics) || !metricsResponse || !operatorStatusResponse;
  const error = isError(metrics) || metricsError || operatorStatusError;
  const disabled = isDisabled(operatorStatusResponse);

  const insightsLink = isUpstream()
    ? `${openshiftHelpBase}support/remote_health_monitoring/using-insights-to-identify-issues-with-your-cluster.html`
    : `${openshiftHelpBase}html/support/remote-health-monitoring-with-connected-clusters#using-insights-to-identify-issues-with-your-cluster`;

  const riskKeys = {
    // t('insights-plugin~low')
    low: 'insights-plugin~low',
    // t('insights-plugin~moderate')
    moderate: 'insights-plugin~moderate',
    // t('insights-plugin~important')
    important: 'insights-plugin~important',
    // t('insights-plugin~critical')
    critical: 'insights-plugin~critical',
  };

  return (
    <Stack hasGutter>
      <StackItem>
        {t(
          'insights-plugin~Insights Advisor identifies and prioritizes risks to security, performance, availability, and stability of your clusters.',
        )}
      </StackItem>
      {error ? (
        <StackItem className="text-muted">
          {t('insights-plugin~Temporarily unavailable.')}
        </StackItem>
      ) : disabled ? (
        <StackItem className="text-muted">{t('insights-plugin~Disabled.')}</StackItem>
      ) : waiting ? (
        <StackItem className="text-muted">{t('insights-plugin~Waiting for results.')}</StackItem>
      ) : (
        <StackItem>
          <div>
            <ChartDonut
              data={riskEntries.map(([k, v]) => ({
                label: `${v} ${k}`,
                x: k,
                y: v,
              }))}
              title={`${numberOfIssues}`}
              subTitle={t('insights-plugin~Total issue', { count: numberOfIssues })}
              legendData={Object.entries(metrics).map(([k, v]) => ({ name: `${k}: ${v}` }))}
              legendOrientation="vertical"
              width={304}
              height={152}
              colorScale={colorScale}
              constrainToVisibleArea
              legendComponent={
                <ChartLegend
                  title={t('insights-plugin~Total Risk')}
                  titleComponent={
                    <ChartLabel dx={13} style={{ fontWeight: 'bold', fontSize: '14px' }} />
                  }
                  data={riskEntries.map(([k, v]) => ({
                    name: `${v} ${t(riskKeys[k])}`,
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
          {clusterID ? (
            <>
              <h6 className="pf-c-title pf-m-md">{t('insights-plugin~Fixable issues')}</h6>
              <div>
                <ExternalLink
                  href={`https://console.redhat.com/openshift/details/${clusterID}#insights`}
                  text={t('insights-plugin~View all in OpenShift Cluster Manager')}
                />
              </div>
            </>
          ) : (
            <div>
              <ExternalLink
                href={`https://console.redhat.com/openshift/`}
                text={t('insights-plugin~Go to OpenShift Cluster Manager')}
              />
            </div>
          )}
        </StackItem>
      )}
      {(waiting || disabled || error) && (
        <ExternalLink href={insightsLink} text={t('insights-plugin~More about Insights')} />
      )}
    </Stack>
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
