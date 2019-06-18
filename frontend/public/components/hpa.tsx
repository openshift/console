import * as React from 'react';
import * as _ from 'lodash';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { K8sResourceKind, K8sResourceKindReference } from '../module/k8s';
import { Conditions } from './conditions';
import { DetailsPage, ListPage, Table, TableRow, TableData } from './factory';
import { Kebab, SectionHeading, LabelList, navFactory, ResourceKebab, ResourceLink, ResourceSummary, Timestamp } from './utils';
import { ResourceEventStream } from './events';

const HorizontalPodAutoscalersReference: K8sResourceKindReference = 'HorizontalPodAutoscaler';

const { common } = Kebab.factory;
const menuActions = [...common];

const MetricsRow: React.SFC<MetricsRowProps> = ({type, current, target}) => <div className="row">
  <div className="col-xs-6">
    {type}
  </div>
  <div className="col-xs-3">
    {current || '-'}
  </div>
  <div className="col-xs-3">
    {target || '-'}
  </div>
</div>;

const externalRow = (metric, current, key) => {
  const { external } = metric;
  const type = external.metricName;
  // TODO: show metric selector for external metrics?
  const currentValue = external.targetAverageValue
    ? _.get(current, 'object.currentAverageValue')
    : _.get(current, 'object.currentValue');
  const targetValue = external.targetAverageValue
    ? external.targetAverageValue
    : external.targetValue;

  return <MetricsRow key={key} type={type} current={currentValue} target={targetValue} />;
};

const objectRow = (metric, current, ns, key) => {
  const { object } = metric;
  const type = <React.Fragment>
    {object.metricName} on
    <ResourceLink kind={object.target.kind} name={object.target.name} namespace={ns} title={object.target.name} />
  </React.Fragment>;
  const currentValue = _.get(current, 'object.currentValue');
  const targetValue = object.targetValue;

  return <MetricsRow key={key} type={type} current={currentValue} target={targetValue} />;
};

const podRow = (metric, current, key) => {
  const { pods } = metric;
  const type = `${pods.metricName} on pods`;
  const currentValue = _.get(current, 'pods.currentAverageValue');
  const targetValue = pods.targetAverageValue;

  return <MetricsRow key={key} type={type} current={currentValue} target={targetValue} />;
};

const getResourceUtilization = currentMetric => {
  const currentUtilization = _.get(currentMetric, 'resource.currentAverageUtilization');

  // Use _.isFinite so that 0 evaluates to true, but null / undefined / NaN don't
  if (!_.isFinite(currentUtilization)) {
    return null;
  }

  const currentAverageValue = _.get(currentMetric, 'resource.currentAverageValue');
  // Only show currentAverageValue in parens if set and non-zero to avoid things like "0% (0)"
  return currentAverageValue && currentAverageValue !== '0'
    ? `${currentUtilization}% (${currentAverageValue})`
    : `${currentUtilization}%`;
};

const resourceRow = (metric, current, key) => {
  const targetUtilization = metric.resource.targetAverageUtilization;
  const resourceLabel = `resource ${metric.resource.name}`;
  const type = targetUtilization
    ? <React.Fragment>{resourceLabel}&nbsp;<span className="small text-muted">(as a percentage of request)</span></React.Fragment>
    : resourceLabel;
  const currentValue = targetUtilization
    ? getResourceUtilization(current)
    : _.get(current, 'resource.currentAverageValue');
  const targetValue = targetUtilization
    ? `${targetUtilization}%`
    : metric.resource.targetAverageValue;

  return <MetricsRow key={key} type={type} current={currentValue} target={targetValue} />;
};

const MetricsTable: React.SFC<MetricsTableProps> = ({obj: hpa}) => {
  return <React.Fragment>
    <SectionHeading text="Metrics" />
    <div className="co-m-table-grid co-m-table-grid--bordered">
      <div className="row co-m-table-grid__head">
        <div className="col-xs-6">Type</div>
        <div className="col-xs-3">Current</div>
        <div className="col-xs-3">Target</div>
      </div>
      <div className="co-m-table-grid__body">
        {hpa.spec.metrics.map((metric, i) => {
          // https://github.com/kubernetes/api/blob/master/autoscaling/v2beta1/types.go
          const current = _.get(hpa, ['status', 'currentMetrics', i]);
          switch (metric.type) {
            case 'External':
              return externalRow(metric, current, i);
            case 'Object':
              return objectRow(metric, current, hpa.metadata.namespace, i);
            case 'Pods':
              return podRow(metric, current, i);
            case 'Resource':
              return resourceRow(metric, current, i);
            default:
              return <div key={i} className="row">
                <div className="col-xs-12">
                  {metric.type} <span className="small text-muted">(unrecognized type)</span>
                </div>
              </div>;
          }
        })}
      </div>
    </div>
  </React.Fragment>;
};

export const HorizontalPodAutoscalersDetails: React.SFC<HorizontalPodAutoscalersDetailsProps> = ({obj: hpa}) => <React.Fragment>
  <div className="co-m-pane__body">
    <SectionHeading text="Horizontal Pod Autoscaler Overview" />
    <div className="row">
      <div className="col-sm-6">
        <ResourceSummary resource={hpa} />
      </div>
      <div className="col-sm-6">
        <dl className="co-m-pane__details">
          <dt>Scale Target</dt>
          <dd>
            <ResourceLink kind={hpa.spec.scaleTargetRef.kind} name={hpa.spec.scaleTargetRef.name} namespace={hpa.metadata.namespace} title={hpa.spec.scaleTargetRef.name} />
          </dd>
          <dt>Min Pods</dt>
          <dd>{hpa.spec.minReplicas}</dd>
          <dt>Max Pods</dt>
          <dd>{hpa.spec.maxReplicas}</dd>
          <dt>Last Scale Time</dt>
          <dd><Timestamp timestamp={hpa.status.lastScaleTime} /></dd>
          <dt>Current Pods</dt>
          <dd>{hpa.status.currentReplicas}</dd>
          <dt>Desired Pods</dt>
          <dd>{hpa.status.desiredReplicas}</dd>
        </dl>
      </div>
    </div>
  </div>
  <div className="co-m-pane__body">
    <MetricsTable obj={hpa} />
  </div>
  <div className="co-m-pane__body">
    <SectionHeading text="Conditions" />
    <Conditions conditions={hpa.status.conditions} />
  </div>
</React.Fragment>;

const pages = [navFactory.details(HorizontalPodAutoscalersDetails), navFactory.editYaml(), navFactory.events(ResourceEventStream)];
export const HorizontalPodAutoscalersDetailsPage: React.SFC<HorizontalPodAutoscalersDetailsPageProps> = props =>
  <DetailsPage
    {...props}
    kind={HorizontalPodAutoscalersReference}
    menuActions={menuActions}
    pages={pages} />;
HorizontalPodAutoscalersDetailsPage.displayName = 'HorizontalPodAutoscalersDetailsPage';

const tableColumnClasses = [
  classNames('col-lg-2', 'col-md-3', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-2', 'col-md-3', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-2', 'col-md-3', 'col-sm-4', 'hidden-xs'),
  classNames('col-lg-2', 'col-md-3', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-2', 'hidden-md', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-2', 'hidden-md', 'hidden-sm', 'hidden-xs'),
  Kebab.columnClass,
];

const kind = 'HorizontalPodAutoscaler';

const HorizontalPodAutoscalersTableHeader = () => {
  return [
    {
      title: 'Name', sortField: 'metadata.name', transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Namespace', sortField: 'metadata.namespace', transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Labels', sortField: 'metadata.labels', transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Scale Target', sortField: 'spec.scaleTargetRef.name', transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Min Pods', sortField: 'spec.minReplicas', transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: 'Max Pods', sortField: 'spec.maxReplicas', transforms: [sortable],
      props: { className: tableColumnClasses[5] },
    },
    {
      title: '', props: { className: tableColumnClasses[6] },
    },
  ];
};
HorizontalPodAutoscalersTableHeader.displayName = 'HorizontalPodAutoscalersTableHeader';

const HorizontalPodAutoscalersTableRow: React.FC<HorizontalPodAutoscalersTableRowProps> = ({obj, index, key, style}) => {
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={HorizontalPodAutoscalersReference} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} title={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <LabelList kind={kind} labels={obj.metadata.labels} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[3], 'co-break-word')}>
        <ResourceLink kind={obj.spec.scaleTargetRef.kind} name={obj.spec.scaleTargetRef.name} namespace={obj.metadata.namespace} title={obj.spec.scaleTargetRef.name} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        {obj.spec.minReplicas}
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        {obj.spec.maxReplicas}
      </TableData>
      <TableData className={tableColumnClasses[6]}>
        <ResourceKebab actions={menuActions} kind={HorizontalPodAutoscalersReference} resource={obj} />
      </TableData>
    </TableRow>
  );
};
HorizontalPodAutoscalersTableRow.displayName = 'HorizontalPodAutoscalersTableRow';
type HorizontalPodAutoscalersTableRowProps = {
  obj: K8sResourceKind;
  index: number;
  key?: string;
  style: object;
};

const HorizontalPodAutoscalersList: React.SFC = props => <Table {...props} aria-label="Horizontal Pod Auto Scalers" Header={HorizontalPodAutoscalersTableHeader} Row={HorizontalPodAutoscalersTableRow} virtualize />;
HorizontalPodAutoscalersList.displayName = 'HorizontalPodAutoscalersList';

export const HorizontalPodAutoscalersPage: React.SFC<HorizontalPodAutoscalersPageProps> = props =>
  <ListPage
    {...props}
    kind={HorizontalPodAutoscalersReference}
    ListComponent={HorizontalPodAutoscalersList}
    canCreate={true}
  />;
HorizontalPodAutoscalersPage.displayName = 'HorizontalPodAutoscalersListPage';

export type HorizontalPodAutoscalersDetailsProps = {
  obj: any,
};

export type HorizontalPodAutoscalersPageProps = {
  showTitle?: boolean,
  namespace?: string,
  selector?: any,
};

export type HorizontalPodAutoscalersDetailsPageProps = {
  match: any,
};

type MetricsTableProps = {
  obj: any,
};

type MetricsRowProps = {
  type: any,
  current: any,
  target: any,
};
