import * as React from 'react';
import { ChartDonut, ChartLegend, ChartLabel } from '@patternfly/react-charts/victory';
import { Stack, StackItem, Title } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { ErrorState } from '@console/internal/components/error';
import {
  documentationURLs,
  ExternalLink,
  getDocumentationURL,
  Timestamp,
  isManaged,
} from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { PrometheusHealthPopupProps } from '@console/plugin-sdk';
import {
  riskIcons,
  colorScale,
  legendColorScale,
  riskSorting,
  mapMetrics,
  isWaiting,
  isError,
  mapConditions,
  errorUpload,
} from './mappers';

const DataComponent: React.FC<DataComponentProps> = ({ x, y, datum }) => {
  const Icon = riskIcons[datum.id];
  return <Icon x={x} y={y - 5} fill={legendColorScale[datum.id]} />;
};

const LabelComponent = ({ clusterID, ...props }) => (
  <ExternalLink
    href={`https://console.redhat.com/openshift/insights/advisor/clusters/${clusterID}?total_risk=${
      riskSorting[props.datum.id] + 1
    }`}
  >
    <ChartLabel
      {...props}
      style={{
        fill: 'var(--pf-t--global--text--color--link--default)',
      }}
    />
  </ExternalLink>
);

const SubTitleComponent = (props) => (
  <ChartLabel
    {...props}
    x={220}
    y={100}
    style={{ fill: 'var(--pf-t--chart--color--black--500)' }}
  />
);

export const InsightsPopup: React.FC<PrometheusHealthPopupProps> = ({ responses, k8sResult }) => {
  const [
    { response: metricsResponse, error: metricsError },
    { response: operatorStatusResponse, error: operatorStatusError },
    { response: lastGatherResponse },
  ] = responses;
  const { t } = useTranslation();
  const metrics = mapMetrics(metricsResponse);
  const conditions = mapConditions(operatorStatusResponse);
  const clusterID = (k8sResult as K8sResourceKind)?.data?.spec?.clusterID || '';
  const riskEntries = Object.entries(metrics).sort(
    ([k1], [k2]) => riskSorting[k2] - riskSorting[k1],
  );
  const numberOfIssues = Object.values(metrics).reduce((acc, cur) => acc + cur, 0);
  const waiting = isWaiting(metrics) || !metricsResponse || !operatorStatusResponse;
  const error = isError(metrics) || metricsError || operatorStatusError;
  const disabled = !!conditions.Disabled;

  const insightsURL = getDocumentationURL(documentationURLs.usingInsights);

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

  const lastRefreshTime =
    parseInt(lastGatherResponse?.data?.result?.[0]?.value?.[1] || '0', 10) * 1000;

  return errorUpload(conditions) ? (
    <ErrorState />
  ) : (
    <Stack hasGutter>
      <StackItem>
        {t('insights-plugin~Last refresh')}: <Timestamp timestamp={lastRefreshTime} simple />
      </StackItem>
      <StackItem className="text-muted">
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
              innerRadius={67}
              ariaTitle="Insights recommendations chart"
              ariaDesc="Donut chart that shows Insights recommendations divided by severities"
              data={riskEntries.map(([k, v]) => ({
                x: `${_.capitalize(t(riskKeys[k]))}`,
                y: v,
              }))}
              title={`${numberOfIssues}`}
              titleComponent={<ChartLabel x={220} y={78} />}
              subTitle={t('insights-plugin~Total issue', { count: numberOfIssues })}
              legendOrientation="vertical"
              width={320}
              height={180}
              radius={80}
              colorScale={colorScale}
              subTitleComponent={<SubTitleComponent />}
              constrainToVisibleArea
              legendComponent={
                <ChartLegend
                  title={t('insights-plugin~Total risk')}
                  titleComponent={
                    <ChartLabel dx={13} dy={-10} style={{ fontWeight: 'bold', fontSize: '14px' }} />
                  }
                  data={riskEntries.map(([k, v]) => ({
                    name: `${v} ${_.capitalize(t(riskKeys[k]))}`,
                    id: k,
                  }))}
                  dataComponent={<DataComponent />}
                  labelComponent={<LabelComponent clusterID={clusterID} />}
                  x={-10}
                  rowGutter={-3}
                />
              }
              padding={{
                bottom: 0,
                left: 135,
                right: 10, // Adjusted to accommodate legend
                top: 0,
              }}
              labels={({ datum }) => `${datum.x}: ${datum.y}`}
              padAngle={0}
            />
          </div>
          {clusterID ? (
            <>
              <Title headingLevel="h6">{t('insights-plugin~Fixable issues')}</Title>
              <div>
                <ExternalLink
                  href={`https://console.redhat.com/openshift/insights/advisor/clusters/${clusterID}`}
                  text={t('insights-plugin~View all recommendations in Insights Advisor')}
                />
              </div>
            </>
          ) : (
            <div>
              <ExternalLink
                href={`https://console.redhat.com/openshift/insights/advisor`}
                text={t('insights-plugin~View more in Insights Advisor')}
              />
            </div>
          )}
        </StackItem>
      )}
      {(waiting || disabled || error) && !isManaged() && (
        <ExternalLink href={insightsURL} text={t('insights-plugin~More about Insights')} />
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
