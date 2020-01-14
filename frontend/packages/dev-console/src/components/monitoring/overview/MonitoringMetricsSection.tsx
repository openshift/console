import * as React from 'react';
import * as _ from 'lodash';
import {
  Accordion,
  AccordionItem,
  AccordionToggle,
  AccordionContent,
  Grid,
  GridItem,
} from '@patternfly/react-core';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { requirePrometheus } from '@console/internal/components/graphs';
import MonitoringDashboardGraph from '../dashboard/MonitoringDashboardGraph';
import { workloadMetricQueries } from './queries';
import './MonitoringSection.scss';

const WorkloadGraphs = requirePrometheus(({ resource }) => {
  const ns = resource.metadata.namespace;
  const workloadName = resource.metadata.name;
  const workloadType = resource.kind.toLowerCase();
  return (
    <Grid className="co-m-pane__body">
      {_.map(workloadMetricQueries, (q) => (
        <GridItem span={12} key={q.title}>
          <MonitoringDashboardGraph
            title={q.title}
            namespace={ns}
            graphType={q.chartType}
            query={q.query({ ns, workloadName, workloadType })}
            humanize={q.humanize}
            byteDataType={q.byteDataType}
          />
        </GridItem>
      ))}
    </Grid>
  );
});

type MonitoringMetricsSectionProps = {
  resource: K8sResourceKind;
};

const MonitoringMetricsSection: React.FC<MonitoringMetricsSectionProps> = ({ resource }) => {
  const [expanded, setExpanded] = React.useState('');

  const onToggle = (id: string) => {
    setExpanded(id === expanded ? '' : id);
  };

  return (
    <div className="odc-monitoring-section">
      <Accordion
        asDefinitionList={false}
        noBoxShadow
        className="odc-monitoring-section__metric-accordion"
        headingLevel="h5"
      >
        <AccordionItem>
          <AccordionToggle
            onClick={() => {
              onToggle('metrics');
            }}
            isExpanded={expanded === 'metrics'}
            id="metrics"
          >
            Metrics
          </AccordionToggle>
          <AccordionContent id="metrics" isHidden={expanded !== 'metrics'}>
            <WorkloadGraphs resource={resource} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default MonitoringMetricsSection;
