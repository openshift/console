import * as React from 'react';
import {
  Accordion,
  AccordionItem,
  AccordionToggle,
  AccordionContent,
  Split,
  SplitItem,
  Badge,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
  EmptyStateHeader,
} from '@patternfly/react-core';
import { InfoCircleIcon } from '@patternfly/react-icons/dist/esm/icons/info-circle-icon';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';
import { Alert } from '@console/dynamic-plugin-sdk';
import { sortEvents } from '@console/internal/components/events';
import { FirehoseResult, LoadingBox } from '@console/internal/components/utils';
import { DeploymentConfigModel } from '@console/internal/models';
import { K8sResourceKind, EventKind, PodKind } from '@console/internal/module/k8s';
import { getFiringAlerts } from '@console/shared';
import WorkloadGraphs from './MonitoringMetrics';
import MonitoringOverviewAlerts from './MonitoringOverviewAlerts';
import MonitoringOverviewEvents from './MonitoringOverviewEvents';
import './MonitoringOverview.scss';

type MonitoringOverviewProps = {
  resource: K8sResourceKind;
  pods?: PodKind[];
  resourceEvents?: FirehoseResult<EventKind[]>;
  monitoringAlerts: Alert[];
};

const MonitoringOverview: React.FC<MonitoringOverviewProps> = (props) => {
  const { t } = useTranslation();
  const { resource, pods, resourceEvents, monitoringAlerts } = props;
  const firingAlerts = getFiringAlerts(monitoringAlerts);
  const [expanded, setExpanded] = React.useState([
    'metrics',
    ...(firingAlerts.length > 0 ? ['monitoring-alerts'] : []),
  ]);

  if (
    !resourceEvents ||
    !resourceEvents.loaded ||
    (pods && pods.find((pod) => !props[pod.metadata.uid] || !props[pod.metadata.uid].loaded))
  ) {
    return <LoadingBox />;
  }

  let events = [...resourceEvents.data];
  if (pods) {
    pods.forEach((pod) => {
      const podData = props[pod.metadata.uid];
      if (podData) {
        events.push(...podData.data);
      }
    });
  }

  events = sortEvents(events);

  const onToggle = (id: string) => {
    const index = expanded.indexOf(id);
    const newExpanded =
      index >= 0
        ? [...expanded.slice(0, index), ...expanded.slice(index + 1, expanded.length)]
        : [...expanded, id];
    setExpanded(newExpanded);
  };

  return (
    <div className="odc-monitoring-overview">
      <Accordion
        asDefinitionList={false}
        className="odc-monitoring-overview__metric-accordion"
        headingLevel="h5"
      >
        {firingAlerts.length > 0 && (
          <AccordionItem>
            <AccordionToggle
              onClick={() => {
                onToggle('monitoring-alerts');
              }}
              isExpanded={expanded.includes('monitoring-alerts')}
              id="monitoring-alerts"
              className="odc-monitoring-overview__alerts-toggle"
            >
              <Split>
                <SplitItem>{t('devconsole~Alerts')}</SplitItem>
                <SplitItem isFilled />
                <SplitItem>
                  <Badge>{monitoringAlerts.length}</Badge>
                </SplitItem>
              </Split>
            </AccordionToggle>
            <AccordionContent
              className="odc-monitoring-overview__alerts-body"
              id="monitoring-alerts-content"
              isHidden={!expanded.includes('monitoring-alerts')}
            >
              <MonitoringOverviewAlerts alerts={firingAlerts} />
            </AccordionContent>
          </AccordionItem>
        )}

        <AccordionItem>
          <AccordionToggle
            onClick={() => {
              onToggle('metrics');
            }}
            isExpanded={expanded.includes('metrics')}
            id="metrics"
          >
            {t('devconsole~Metrics')}
          </AccordionToggle>
          <AccordionContent id="metrics-content" isHidden={!expanded.includes('metrics')}>
            {resource.kind === DeploymentConfigModel.kind ? (
              <EmptyState>
                <EmptyStateHeader
                  titleText={<>{t('devconsole~No metrics found')}</>}
                  icon={
                    <EmptyStateIcon
                      className="odc-monitoring-overview__empty-state-icon"
                      icon={InfoCircleIcon}
                    />
                  }
                  headingLevel="h2"
                />
                <EmptyStateBody>
                  {t('devconsole~Deployment Configuration metrics are not yet supported.')}
                </EmptyStateBody>
              </EmptyState>
            ) : (
              <>
                <div className="odc-monitoring-overview__view-monitoring-dashboards">
                  <Link
                    to={`/dev-monitoring/ns/${
                      resource?.metadata?.namespace
                    }?dashboard=grafana-dashboard-k8s-resources-workload&workload=${
                      resource?.metadata?.name
                    }&type=${resource?.kind?.toLowerCase()}`}
                    data-test="observe-dashboards-link"
                  >
                    {t('devconsole~View dashboards')}
                  </Link>
                </div>
                <WorkloadGraphs resource={resource} />
              </>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem>
          <AccordionToggle
            onClick={() => {
              onToggle('all-events');
            }}
            isExpanded={expanded.includes('all-events')}
            id="all-events"
          >
            {t('devconsole~All events')}
          </AccordionToggle>
          <AccordionContent id="all-events-content" isHidden={!expanded.includes('all-events')}>
            <MonitoringOverviewEvents events={events} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default MonitoringOverview;
