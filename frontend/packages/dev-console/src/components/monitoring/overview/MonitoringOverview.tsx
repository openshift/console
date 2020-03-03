import * as React from 'react';
import * as _ from 'lodash';
import { Link } from 'react-router-dom';
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
  Title,
} from '@patternfly/react-core';
import { InfoCircleIcon } from '@patternfly/react-icons';
import { K8sResourceKind, EventKind } from '@console/internal/module/k8s';
import { DeploymentConfigModel } from '@console/internal/models';
import MonitoringOverviewEventsWarning from './MonitoringOverviewEventsWarning';
import MonitoringOverviewEvents from './MonitoringOverviewEvents';
import WorkloadGraphs from './MonitoringMetrics';
import './MonitoringOverview.scss';

type MonitoringOverviewProps = {
  resource: K8sResourceKind;
  events: EventKind[];
};

const MonitoringOverview: React.FC<MonitoringOverviewProps> = ({ resource, events }) => {
  const [expanded, setExpanded] = React.useState(['metrics']);
  const eventWarning = _.filter(events, ['type', 'Warning']);

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
        noBoxShadow
        className="odc-monitoring-overview__metric-accordion"
        headingLevel="h5"
      >
        <AccordionItem>
          <AccordionToggle
            onClick={() => {
              onToggle('events-warning');
            }}
            isExpanded={expanded.includes('events-warning')}
            id="events-warning"
            className="odc-monitoring-overview__event-warning-toggle"
          >
            <Split>
              <SplitItem>Events (Warning)</SplitItem>
              <SplitItem isFilled />
              <SplitItem>
                <Badge>{eventWarning.length}</Badge>
              </SplitItem>
            </Split>
          </AccordionToggle>
          <AccordionContent
            className="odc-monitoring-overview__event-warning-body"
            id="events-warning-content"
            isHidden={!expanded.includes('events-warning')}
          >
            <MonitoringOverviewEventsWarning events={eventWarning} />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem>
          <AccordionToggle
            onClick={() => {
              onToggle('metrics');
            }}
            isExpanded={expanded.includes('metrics')}
            id="metrics"
          >
            Metrics
          </AccordionToggle>
          <AccordionContent id="metrics-content" isHidden={!expanded.includes('metrics')}>
            {resource.kind === DeploymentConfigModel.kind ? (
              <EmptyState>
                <EmptyStateIcon
                  className="odc-monitoring-overview__empty-state-icon"
                  icon={InfoCircleIcon}
                />
                <Title size="md">No Metrics Found</Title>
                <EmptyStateBody>
                  Deployment Configuration metrics are not yet supported.
                </EmptyStateBody>
              </EmptyState>
            ) : (
              <>
                <div className="odc-monitoring-overview__view-monitoring-dashboard">
                  <Link
                    to={`/dev-monitoring/ns/${resource?.metadata?.namespace}/?workloadName=${
                      resource?.metadata?.name
                    }&workloadType=${resource?.kind?.toLowerCase()}`}
                  >
                    View monitoring dashboard
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
            All Events
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
