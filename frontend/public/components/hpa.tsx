import * as React from 'react';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { Trans, useTranslation } from 'react-i18next';
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

const MetricsTable: React.FC<MetricsTableProps> = ({ obj: hpa }) => {
  const { t } = useTranslation();
  const resourceRow = (metric, current, key) => {
    const { resource } = metric;
    const targetUtilization = resource.target.averageUtilization;
    const resourceLabel = t('public~resource {{name}}', { name: resource.name });
    const type = targetUtilization ? (
      <>
        {resourceLabel}&nbsp;
        <span className="small text-muted">{t('public~(as a percentage of request)')}</span>
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

  const podRow = (metric, current, key) => {
    const { pods } = metric;
    const type = t('public~{{name}} on pods', { name: pods.metric.name });
    const currentValue = current?.pods?.current.averageValue;
    const targetValue = pods.target.averageValue;

    return <MetricsRow key={key} type={type} current={currentValue} target={targetValue} />;
  };

  const objectRow = (metric, current, ns, key, scaleTarget) => {
    const { object } = metric;
    const name = object.metric.name;
    const type = (
      <Trans t={t} ns="public">
        {{ name }} on
        <ResourceLink
          kind={scaleTarget.kind}
          name={scaleTarget.name}
          namespace={ns}
          title={object.metric.name}
        />
      </Trans>
    );
    const currentValue = current?.object?.current.value;
    const targetValue = object.target.value;

    return <MetricsRow key={key} type={type} current={currentValue} target={targetValue} />;
  };

  return (
    <>
      <SectionHeading text={t('public~Metrics')} />
      <div className="co-m-table-grid co-m-table-grid--bordered">
        <div className="row co-m-table-grid__head">
          <div className="col-xs-6">{t('public~Type')}</div>
          <div className="col-xs-3">{t('public~Current')}</div>
          <div className="col-xs-3">{t('public~Target')}</div>
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
                      {metric.type}{' '}
                      <span className="small text-muted">{t('public~(unrecognized type)')}</span>
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
}) => {
  const { t } = useTranslation();
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={t('public~HorizontalPodAutoscaler details')} />
        <div className="row">
          <div className="col-sm-6">
            <ResourceSummary resource={hpa} />
          </div>
          <div className="col-sm-6">
            <dl className="co-m-pane__details">
              <DetailsItem label={t('public~Scale target')} obj={hpa} path="spec.scaleTargetRef">
                <ResourceLink
                  kind={hpa.spec.scaleTargetRef.kind}
                  name={hpa.spec.scaleTargetRef.name}
                  namespace={hpa.metadata.namespace}
                  title={hpa.spec.scaleTargetRef.name}
                />
              </DetailsItem>
              <DetailsItem label={t('public~Min replicas')} obj={hpa} path="spec.minReplicas" />
              <DetailsItem label={t('public~Max replicas')} obj={hpa} path="spec.maxReplicas" />
              <DetailsItem
                label={t('public~Last scale time')}
                obj={hpa}
                path="status.lastScaleTime"
              >
                <Timestamp timestamp={hpa.status.lastScaleTime} />
              </DetailsItem>
              <DetailsItem
                label={t('public~Current replicas')}
                obj={hpa}
                path="status.currentReplicas"
              />
              <DetailsItem
                label={t('public~Desired replicas')}
                obj={hpa}
                path="status.desiredReplicas"
              />
            </dl>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <MetricsTable obj={hpa} />
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('public~Conditions')} />
        <Conditions conditions={hpa.status.conditions} />
      </div>
    </>
  );
};

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
  '',
  '',
  'pf-m-hidden pf-m-visible-on-md',
  'pf-m-hidden pf-m-visible-on-lg',
  'pf-m-hidden pf-m-visible-on-xl',
  'pf-m-hidden pf-m-visible-on-xl',
  Kebab.columnClass,
];

const kind = 'HorizontalPodAutoscaler';

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
        />
      </TableData>
      <TableData
        className={classNames(tableColumnClasses[1], 'co-break-word')}
        columnID="namespace"
      >
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
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

const HorizontalPodAutoscalersList: React.FC = (props) => {
  const { t } = useTranslation();
  const HorizontalPodAutoscalersTableHeader = () => [
    {
      title: t('public~Name'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: t('public~Namespace'),
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
      id: 'namespace',
    },
    {
      title: t('public~Labels'),
      sortField: 'metadata.labels',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: t('public~Scale target'),
      sortField: 'spec.scaleTargetRef.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: t('public~Min pods'),
      sortField: 'spec.minReplicas',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: t('public~Max pods'),
      sortField: 'spec.maxReplicas',
      transforms: [sortable],
      props: { className: tableColumnClasses[5] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[6] },
    },
  ];

  return (
    <Table
      {...props}
      aria-label="Horizontal Pod Auto Scalers"
      Header={HorizontalPodAutoscalersTableHeader}
      Row={HorizontalPodAutoscalersTableRow}
      virtualize
    />
  );
};
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
