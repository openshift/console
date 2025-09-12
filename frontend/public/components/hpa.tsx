import * as React from 'react';
import * as _ from 'lodash-es';
import { Table as PfTable, Th, Tr, Thead, Tbody, Td } from '@patternfly/react-table';
import { Trans, useTranslation } from 'react-i18next';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { K8sResourceKindReference, HorizontalPodAutoscalerKind, TableColumn } from '../module/k8s';
import { HorizontalPodAutoscalerModel } from '../models';
import { Conditions } from './conditions';
import { DetailsPage, ListPage } from './factory';
import {
  DetailsItem,
  Kebab,
  LabelList,
  LoadingBox,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  navFactory,
} from './utils';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { ResourceEventStream } from './events';
import { DescriptionList, Grid, GridItem } from '@patternfly/react-core';
import {
  actionsCellProps,
  cellIsStickyProps,
  getNameCellProps,
  initialFiltersDefault,
  ResourceDataView,
} from '@console/app/src/components/data-view/ResourceDataView';
import { GetDataViewRows } from '@console/app/src/components/data-view/types';
import { DASH } from '@console/shared';

const HorizontalPodAutoscalersReference: K8sResourceKindReference = 'HorizontalPodAutoscaler';

const { common } = Kebab.factory;
const menuActions = [...Kebab.getExtensionsActionsForKind(HorizontalPodAutoscalerModel), ...common];

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

const tableColumnInfo = [
  { id: 'name' },
  { id: 'namespace' },
  { id: 'labels' },
  { id: 'scaleTarget' },
  { id: 'minReplicas' },
  { id: 'maxReplicas' },
  { id: '' },
];

const useHorizontalPodAutoscalersColumns = () => {
  const { t } = useTranslation();
  const columns: TableColumn<HorizontalPodAutoscalerKind>[] = React.useMemo(() => {
    return [
      {
        title: t('public~Name'),
        id: tableColumnInfo[0].id,
        sort: 'metadata.name',
        props: {
          ...cellIsStickyProps,
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Namespace'),
        id: tableColumnInfo[1].id,
        sort: 'metadata.namespace',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Labels'),
        id: tableColumnInfo[2].id,
        sort: 'metadata.labels',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Scale target'),
        id: tableColumnInfo[3].id,
        sort: 'spec.scaleTargetRef.name',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Min pods'),
        id: tableColumnInfo[4].id,
        sort: 'spec.minReplicas',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Max pods'),
        id: tableColumnInfo[5].id,
        sort: 'spec.maxReplicas',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: '',
        id: tableColumnInfo[6].id,
        props: {
          ...cellIsStickyProps,
        },
      },
    ];
  }, [t]);
  return columns;
};

const getDataViewRows: GetDataViewRows<HorizontalPodAutoscalerKind, undefined> = (
  data,
  columns,
) => {
  return data.map(({ obj }) => {
    const { name, namespace } = obj.metadata;

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: (
          <span className="co-resource-item">
            <ResourceLink kind="HorizontalPodAutoscaler" name={name} namespace={namespace} />
          </span>
        ),
        props: getNameCellProps(name),
      },
      [tableColumnInfo[1].id]: {
        cell: <ResourceLink kind="Namespace" name={namespace} />,
      },
      [tableColumnInfo[2].id]: {
        cell: <LabelList kind="HorizontalPodAutoscaler" labels={obj.metadata.labels} />,
      },
      [tableColumnInfo[3].id]: {
        cell: (
          <ResourceLink
            kind={obj.spec.scaleTargetRef.kind}
            name={obj.spec.scaleTargetRef.name}
            namespace={namespace}
            title={obj.spec.scaleTargetRef.name}
          />
        ),
      },
      [tableColumnInfo[4].id]: {
        cell: obj.spec.minReplicas || '-',
      },
      [tableColumnInfo[5].id]: {
        cell: obj.spec.maxReplicas || '-',
      },
      [tableColumnInfo[6].id]: {
        cell: <ResourceKebab actions={menuActions} kind="HorizontalPodAutoscaler" resource={obj} />,
        props: {
          ...actionsCellProps,
        },
      },
    };

    return columns.map(({ id }) => {
      const cell = rowCells[id]?.cell || DASH;
      return {
        id,
        props: rowCells[id]?.props,
        cell,
      };
    });
  });
};

export const HorizontalPodAutoscalersList: React.FC<HorizontalPodAutoscalersListProps> = ({
  data,
  loaded,
  ...props
}) => {
  const columns = useHorizontalPodAutoscalersColumns();

  return (
    <React.Suspense fallback={<LoadingBox />}>
      <ResourceDataView
        {...props}
        label={HorizontalPodAutoscalerModel.labelPlural}
        data={data}
        loaded={loaded}
        columns={columns}
        initialFilters={initialFiltersDefault}
        getDataViewRows={getDataViewRows}
        hideColumnManagement={true}
      />
    </React.Suspense>
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
    omitFilterToolbar={true}
  />
);
HorizontalPodAutoscalersPage.displayName = 'HorizontalPodAutoscalersListPage';

export type HorizontalPodAutoscalersDetailsProps = {
  obj: HorizontalPodAutoscalerKind;
};

export type HorizontalPodAutoscalersListProps = {
  data: HorizontalPodAutoscalerKind[];
  loaded: boolean;
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
