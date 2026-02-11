import type { FC } from 'react';
import { useState } from 'react';
import {
  Accordion,
  AccordionItem,
  AccordionToggle,
  AccordionContent,
  Split,
  SplitItem,
  Badge,
  EmptyState,
  EmptyStateBody,
} from '@patternfly/react-core';
import { InfoCircleIcon } from '@patternfly/react-icons/dist/esm/icons/info-circle-icon';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';
import { Alert } from '@console/dynamic-plugin-sdk';
import { sortEvents } from '@console/internal/components/events';
import { LoadingBox } from '@console/internal/components/utils';
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
  resourceEvents?: {
    data: EventKind[];
    loaded: boolean;
    loadError?: Error;
  };
  monitoringAlerts: Alert[];
};

const MonitoringOverview: FC<MonitoringOverviewProps> = (props) => {
  const { t } = useTranslation();
  const { resource, pods, resourceEvents, monitoringAlerts } = props;
  const firingAlerts = getFiringAlerts(monitoringAlerts);
  const [expanded, setExpanded] = useState([
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

  // query params:
  // namespace - used within dashboard logic for variables
  // project-dropdown-value - used for namespace dropdown for console

  const dashboardLinkParams = new URLSearchParams({
    workload: resource?.metadata?.name ?? '',
    type: resource?.kind?.toLowerCase() ?? '',
    'project-dropdown-value': resource?.metadata?.namespace ?? '',
    namespace: resource?.metadata?.namespace ?? '',
  });

  return (
    <div className="odc-monitoring-overview">
      <Accordion
        asDefinitionList={false}
        className="odc-monitoring-overview__metric-accordion"
        headingLevel="h5"
      >
        {firingAlerts.length > 0 && (
          <AccordionItem
            isExpanded={expanded.includes('monitoring-alerts')}
            id="monitoring-alerts-accordian-item"
          >
            <AccordionToggle
              onClick={() => {
                onToggle('monitoring-alerts');
              }}
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
            >
              <MonitoringOverviewAlerts alerts={firingAlerts} />
            </AccordionContent>
          </AccordionItem>
        )}

        <AccordionItem isExpanded={expanded.includes('metrics')} id="metrics-accordian-item">
          <AccordionToggle
            onClick={() => {
              onToggle('metrics');
            }}
            id="metrics"
          >
            {t('devconsole~Metrics')}
          </AccordionToggle>
          <AccordionContent id="metrics-content">
            {resource.kind === DeploymentConfigModel.kind ? (
              <EmptyState
                headingLevel="h2"
                icon={InfoCircleIcon}
                titleText={<>{t('devconsole~No metrics found')}</>}
              >
                <EmptyStateBody>
                  {t('devconsole~Deployment Configuration metrics are not yet supported.')}
                </EmptyStateBody>
              </EmptyState>
            ) : (
              <>
                <div className="odc-monitoring-overview__view-monitoring-dashboards">
                  <Link
                    to={`/monitoring/dashboards/dashboard-k8s-resources-workload?${dashboardLinkParams.toString()}`}
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

        <AccordionItem isExpanded={expanded.includes('all-events')} id="all-events-accordian-item">
          <AccordionToggle
            onClick={() => {
              onToggle('all-events');
            }}
            id="all-events"
          >
            {t('devconsole~All events')}
          </AccordionToggle>
          <AccordionContent id="all-events-content">
            <MonitoringOverviewEvents events={events} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default MonitoringOverview;
