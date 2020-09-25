import * as React from 'react';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import {
  K8sResourceKind,
  K8sResourceKindReference,
  HorizontalPodAutoscalerKind,
} from '../module/k8s';
import { HorizontalPodAutoscalerModel } from '../models';
import { Conditions } from './conditions';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from './factory';
import {
  DetailsItem,
  Kebab,
  LabelList,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  Timestamp,
  navFactory,
} from './utils';
import { ResourceEventStream } from './events';

const HorizontalPodAutoscalersReference: K8sResourceKindReference = 'HorizontalPodAutoscaler';

const { common } = Kebab.factory;
const menuActions = [...Kebab.getExtensionsActionsForKind(HorizontalPodAutoscalerModel), ...common];

const MetricsRow: React.FC<MetricsRowProps> = ({ type, current, target }) => (
  <div className="row">
    <div className="col-xs-6">{type}</div>
    <div className="col-xs-3">{current || '-'}</div>
    <div className="col-xs-3">{target || '-'}</div>
  </div>
);

const externalRow = (metric, current, key) => {
  const { external } = metric;
  const type = external.metric.name;
  const currentValue =
    current?.external?.current?.averageValue || current?.external?.current?.value;
  const targetValue = external.target.averageValue || external.target.value;

  return <MetricsRow key={key} type={type} current={currentValue} target={targetValue} />;
};

const objectRow = (metric, current, ns, key, scaleTarget) => {
  const { object } = metric;
  const type = (
    <>
      {object.metric.name} on
      <ResourceLink
        kind={scaleTarget.kind}
        name={scaleTarget.name}
        namespace={ns}
        title={object.metric.name}
      />
    </>
  );
  const currentValue = current?.object?.current.value;
  const targetValue = object.target.value;

  return <MetricsRow key={key} type={type} current={currentValue} target={targetValue} />;
};

const podRow = (metric, current, key) => {
  const { pods } = metric;
  const type = `${pods.metric.name} on pods`;
  const currentValue = current?.pods?.current.averageValue;
  const targetValue = pods.target.averageValue;

  return <MetricsRow key={key} type={type} current={currentValue} target={targetValue} />;
};

const getResourceUtilization = (currentMetric) => {
  const currentUtilization = currentMetric?.resource?.current?.averageUtilization;

  // Use _.isFinite so that 0 evaluates to true, but null / undefined / NaN don't
  if (!_.isFinite(currentUtilization)) {
    return null;
  }

  const currentAverageValue = currentMetric?.resource?.current?.averageValue;
  // Only show currentAverageValue in parens if set and non-zero to avoid things like "0% (0)"
  return currentAverageValue && currentAverageValue !== '0'
    ? `${currentUtilization}% (${currentAverageValue})`
    : `${currentUtilization}%`;
};

const resourceRow = (metric, current, key) => {
  const { resource } = metric;
  const targetUtilization = resource.target.averageUtilization;
  const resourceLabel = `resource ${resource.name}`;
  const type = targetUtilization ? (
    <>
      {resourceLabel}&nbsp;<span className="small text-muted">(as a percentage of request)</span>
    </>
  ) : (
    resourceLabel
  );
  const currentValue = targetUtilization
    ? getResourceUtilization(current)
    : resource?.current?.averageValue;
  const targetValue = targetUtilization ? `${targetUtilization}%` : resource.target.averageValue;

  return <MetricsRow key={key} type={type} current={currentValue} target={targetValue} />;
};

const MetricsTable: React.FC<MetricsTableProps> = ({ obj: hpa }) => {
  return (
    <>
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
                return objectRow(
                  metric,
                  current,
                  hpa.metadata.namespace,
                  i,
                  hpa.spec.scaleTargetRef,
                );
              case 'Pods':
                return podRow(metric, current, i);
              case 'Resource':
                return resourceRow(metric, current, i);
              default:
                return (
                  <div key={i} className="row">
                    <div className="col-xs-12">
                      {metric.type} <span className="small text-muted">(unrecognized type)</span>
                    </div>
                  </div>
                );
            }
          })}
        </div>
      </div>
    </>
  );
};

export const HorizontalPodAutoscalersDetails: React.FC<HorizontalPodAutoscalersDetailsProps> = ({
  obj: hpa,
}) => (
  <>
    <div className="co-m-pane__body">
      <SectionHeading text="Horizontal Pod Autoscaler Details" />
      <div className="row">
        <div className="col-sm-6">
          <ResourceSummary resource={hpa} />
        </div>
        <div className="col-sm-6">
          <dl className="co-m-pane__details">
            <DetailsItem label="Scale Target" obj={hpa} path="spec.scaleTargetRef">
              <ResourceLink
                kind={hpa.spec.scaleTargetRef.kind}
                name={hpa.spec.scaleTargetRef.name}
                namespace={hpa.metadata.namespace}
                title={hpa.spec.scaleTargetRef.name}
              />
            </DetailsItem>
            <DetailsItem label="Min Replicas" obj={hpa} path="spec.minReplicas" />
            <DetailsItem label="Max Replicas" obj={hpa} path="spec.maxReplicas" />
            <DetailsItem label="Last Scale Time" obj={hpa} path="status.lastScaleTime">
              <Timestamp timestamp={hpa.status.lastScaleTime} />
            </DetailsItem>
            <DetailsItem label="Current Replicas" obj={hpa} path="status.currentReplicas" />
            <DetailsItem label="Desired Replicas" obj={hpa} path="status.desiredReplicas" />
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
  </>
);

const pages = [
  navFactory.details(HorizontalPodAutoscalersDetails),
  navFactory.editYaml(),
  navFactory.events(ResourceEventStream),
];
export const HorizontalPodAutoscalersDetailsPage: React.FC<HorizontalPodAutoscalersDetailsPageProps> = (
  props,
) => (
  <DetailsPage
    {...props}
    kind={HorizontalPodAutoscalersReference}
    menuActions={menuActions}
    pages={pages}
  />
);
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
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Namespace',
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
      id: 'namespace',
    },
    {
      title: 'Labels',
      sortField: 'metadata.labels',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Scale Target',
      sortField: 'spec.scaleTargetRef.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Min Pods',
      sortField: 'spec.minReplicas',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: 'Max Pods',
      sortField: 'spec.maxReplicas',
      transforms: [sortable],
      props: { className: tableColumnClasses[5] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[6] },
    },
  ];
};
HorizontalPodAutoscalersTableHeader.displayName = 'HorizontalPodAutoscalersTableHeader';

const HorizontalPodAutoscalersTableRow: RowFunction<K8sResourceKind> = ({
  obj,
  index,
  key,
  style,
}) => {
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={HorizontalPodAutoscalersReference}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
          title={obj.metadata.name}
        />
      </TableData>
      <TableData
        className={classNames(tableColumnClasses[1], 'co-break-word')}
        columnID="namespace"
      >
        <ResourceLink
          kind="Namespace"
          name={obj.metadata.namespace}
          title={obj.metadata.namespace}
        />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <LabelList kind={kind} labels={obj.metadata.labels} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[3], 'co-break-word')}>
        <ResourceLink
          kind={obj.spec.scaleTargetRef.kind}
          name={obj.spec.scaleTargetRef.name}
          namespace={obj.metadata.namespace}
          title={obj.spec.scaleTargetRef.name}
        />
      </TableData>
      <TableData className={tableColumnClasses[4]}>{obj.spec.minReplicas}</TableData>
      <TableData className={tableColumnClasses[5]}>{obj.spec.maxReplicas}</TableData>
      <TableData className={tableColumnClasses[6]}>
        <ResourceKebab
          actions={menuActions}
          kind={HorizontalPodAutoscalersReference}
          resource={obj}
        />
      </TableData>
    </TableRow>
  );
};

const HorizontalPodAutoscalersList: React.SFC = (props) => (
  <Table
    {...props}
    aria-label="Horizontal Pod Auto Scalers"
    Header={HorizontalPodAutoscalersTableHeader}
    Row={HorizontalPodAutoscalersTableRow}
    virtualize
  />
);
HorizontalPodAutoscalersList.displayName = 'HorizontalPodAutoscalersList';

export const HorizontalPodAutoscalersPage: React.FC<HorizontalPodAutoscalersPageProps> = (
  props,
) => (
  <ListPage
    {...props}
    kind={HorizontalPodAutoscalersReference}
    ListComponent={HorizontalPodAutoscalersList}
    canCreate={true}
  />
);
HorizontalPodAutoscalersPage.displayName = 'HorizontalPodAutoscalersListPage';

export type HorizontalPodAutoscalersDetailsProps = {
  obj: HorizontalPodAutoscalerKind;
};

export type HorizontalPodAutoscalersPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

export type HorizontalPodAutoscalersDetailsPageProps = {
  match: any;
};

type MetricsTableProps = {
  obj: HorizontalPodAutoscalerKind;
};

type MetricsRowProps = {
  type: any;
  current: any;
  target: any;
};
