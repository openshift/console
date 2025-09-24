import * as React from 'react';
import * as _ from 'lodash-es';
import { css } from '@patternfly/react-styles';
import { sortable, Table as PfTable, Th, Tr, Thead, Tbody, Td } from '@patternfly/react-table';
import { Trans, useTranslation } from 'react-i18next';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import {
  K8sResourceKind,
  K8sResourceKindReference,
  HorizontalPodAutoscalerKind,
} from '../module/k8s';
import { Conditions } from './conditions';
import { DetailsPage, ListPage, Table, TableData, RowFunctionArgs } from './factory';
import {
  DetailsItem,
  Kebab,
  LabelList,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  navFactory,
} from './utils';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { ResourceEventStream } from './events';
import { DescriptionList, Grid, GridItem } from '@patternfly/react-core';

const HorizontalPodAutoscalersReference: K8sResourceKindReference = 'HorizontalPodAutoscaler';

const { common } = Kebab.factory;
const menuActions = [...common];

const MetricsRow: React.FC<MetricsRowProps> = ({ type, current, target }) => (
  <Tr>
    <Td width={50}>{type}</Td>
    <Td width={25}>{current || '-'}</Td>
    <Td width={25}>{target || '-'}</Td>
  </Tr>
);

const externalRow = (metric, current, key) => {
  const { external } = metric;
  const type = external.metric.name;
  const currentValue =
    current?.external?.current?.averageValue || current?.external?.current?.value;
  const targetValue = external.target.averageValue || external.target.value;

  return <MetricsRow key={key} type={type} current={currentValue} target={targetValue} />;
};

const getResourceUtilization = (currentMetric, type) => {
  const currentUtilization = currentMetric?.[type]?.current?.averageUtilization;

  // Use _.isFinite so that 0 evaluates to true, but null / undefined / NaN don't
  if (!_.isFinite(currentUtilization)) {
    return null;
  }

  const currentAverageValue = currentMetric?.[type]?.current?.averageValue;
  // Only show currentAverageValue in parens if set and non-zero to avoid things like "0% (0)"
  return currentAverageValue && currentAverageValue !== '0'
    ? `${currentUtilization}% (${currentAverageValue})`
    : `${currentUtilization}%`;
};

const MetricsTable: React.FC<MetricsTableProps> = ({ obj: hpa }) => {
  const { t } = useTranslation();

  const resourceRowFn = (metric, current, key, metricType) => {
    const metricObj = metric[metricType];
    const targetUtilization = metricObj.target.averageUtilization;
    const resourceLabel = t('public~{{type}} {{name}}', {
      type: metric.type,
      name: metricObj.name,
    });
    const type = targetUtilization ? (
      <>
        {resourceLabel}&nbsp;
        <span className="pf-v6-u-font-size-xs pf-v6-u-text-color-subtle">
          {t('public~(as a percentage of request)')}
        </span>
      </>
    ) : (
      resourceLabel
    );
    const currentValue = targetUtilization
      ? getResourceUtilization(current, metricType)
      : current?.[metricType]?.current?.averageValue;
    const targetValue = targetUtilization ? `${targetUtilization}%` : metricObj.target.averageValue;

    return <MetricsRow key={key} type={type} current={currentValue} target={targetValue} />;
  };

  const resourceRow = (metric, current, key) => {
    return resourceRowFn(metric, current, key, 'resource');
  };

  const containerResourceRow = (metric, current, key) => {
    return resourceRowFn(metric, current, key, 'containerResource');
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
      <PfTable gridBreakPoint="">
        <Thead>
          <Tr>
            <Th width={50}>{t('public~Type')}</Th>
            <Th width={25}>{t('public~Current')}</Th>
            <Th width={25}>{t('public~Target')}</Th>
          </Tr>
        </Thead>
        <Tbody>
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
              case 'ContainerResource':
                return containerResourceRow(metric, current, i);
              default:
                return (
                  <Tr key={i}>
                    <Td width={50}>
                      {metric.type}{' '}
                      <span className="pf-v6-u-font-size-xs pf-v6-u-text-color-subtle">
                        {t('public~(unrecognized type)')}
                      </span>
                    </Td>
                  </Tr>
                );
            }
          })}
        </Tbody>
      </PfTable>
    </>
  );
};

export const HorizontalPodAutoscalersDetails: React.FC<HorizontalPodAutoscalersDetailsProps> = ({
  obj: hpa,
}) => {
  const { t } = useTranslation();
  return (
    <>
      <PaneBody>
        <SectionHeading text={t('public~HorizontalPodAutoscaler details')} />
        <Grid hasGutter>
          <GridItem sm={6}>
            <ResourceSummary resource={hpa} />
          </GridItem>
          <GridItem sm={6}>
            <DescriptionList>
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
            </DescriptionList>
          </GridItem>
        </Grid>
      </PaneBody>
      <PaneBody>
        <MetricsTable obj={hpa} />
      </PaneBody>
      <PaneBody>
        <SectionHeading text={t('public~Conditions')} />
        <Conditions conditions={hpa.status.conditions} />
      </PaneBody>
    </>
  );
};

const pages = [
  navFactory.details(HorizontalPodAutoscalersDetails),
  navFactory.editYaml(),
  navFactory.events(ResourceEventStream),
];
export const HorizontalPodAutoscalersDetailsPage: React.FC = (props) => (
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

const HorizontalPodAutoscalersTableRow: React.FC<RowFunctionArgs<K8sResourceKind>> = ({ obj }) => {
  return (
    <>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={HorizontalPodAutoscalersReference}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
        />
      </TableData>
      <TableData className={css(tableColumnClasses[1], 'co-break-word')} columnID="namespace">
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <LabelList kind={kind} labels={obj.metadata.labels} />
      </TableData>
      <TableData className={css(tableColumnClasses[3], 'co-break-word')}>
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
    </>
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
      aria-label={t('public~HorizontalPodAutoScalers')}
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

type MetricsTableProps = {
  obj: HorizontalPodAutoscalerKind;
};

type MetricsRowProps = {
  type: any;
  current: any;
  target: any;
};
