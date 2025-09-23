import * as React from 'react';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import {
  getPodsForResource,
  ActionServiceProvider,
  ActionMenu,
  ActionMenuVariant,
  LazyActionMenu,
  DASH,
} from '@console/shared';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { DetailsPage, ListPage, ListPageWrapper } from './factory';
import {
  CronJobKind,
  K8sResourceCommon,
  K8sResourceKind,
  referenceForModel,
  referenceFor,
  TableColumn,
} from '../module/k8s';
import {
  ContainerTable,
  DetailsItem,
  Firehose,
  Kebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  navFactory,
  FirehoseResourcesResult,
} from './utils';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { ResourceEventStream } from './events';
import { CronJobModel } from '../models';
import { PodList, getFilters as getPodFilters } from './pod';
import { JobsList } from './job';
import { PodDisruptionBudgetField } from '@console/app/src/components/pdb/PodDisruptionBudgetField';
import { DescriptionList, Grid, GridItem } from '@patternfly/react-core';
import {
  actionsCellProps,
  cellIsStickyProps,
  getNameCellProps,
  initialFiltersDefault,
  ResourceDataView,
} from '@console/app/src/components/data-view/ResourceDataView';
import { GetDataViewRows } from '@console/app/src/components/data-view/types';
import { getGroupVersionKindForModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import { LoadingBox } from './utils/status-box';

const { common } = Kebab.factory;
export const menuActions = [...common];

const kind = referenceForModel(CronJobModel);

const tableColumnInfo = [
  { id: 'name' },
  { id: 'namespace' },
  { id: 'schedule' },
  { id: 'suspend' },
  { id: 'concurrencyPolicy' },
  { id: 'startingDeadlineSeconds' },
  { id: 'actions' },
];

const getDataViewRows: GetDataViewRows<CronJobKind, undefined> = (data, columns) => {
  return data.map(({ obj: cronjob }) => {
    const { name, namespace } = cronjob.metadata;
    const resourceKind = referenceFor(cronjob);
    const context = { [resourceKind]: cronjob };

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: (
          <ResourceLink
            groupVersionKind={getGroupVersionKindForModel(CronJobModel)}
            name={name}
            namespace={namespace}
          />
        ),
        props: getNameCellProps(name),
      },
      [tableColumnInfo[1].id]: {
        cell: <ResourceLink kind="Namespace" name={namespace} />,
      },
      [tableColumnInfo[2].id]: {
        cell: <span>{cronjob.spec.schedule}</span>,
      },
      [tableColumnInfo[3].id]: {
        cell: (
          <span>
            {cronjob.spec?.suspend ? i18next.t('public~True') : i18next.t('public~False')}
          </span>
        ),
      },
      [tableColumnInfo[4].id]: {
        cell: <span>{cronjob.spec?.concurrencyPolicy || DASH}</span>,
      },
      [tableColumnInfo[5].id]: {
        cell: <span>{cronjob.spec?.startingDeadlineSeconds || DASH}</span>,
      },
      [tableColumnInfo[6].id]: {
        cell: <LazyActionMenu context={context} />,
        props: actionsCellProps,
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

const useCronJobsColumns = (): TableColumn<CronJobKind>[] => {
  const { t } = useTranslation();
  const columns: TableColumn<CronJobKind>[] = React.useMemo(() => {
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
        title: t('public~Schedule'),
        id: tableColumnInfo[2].id,
        sort: 'spec.schedule',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Suspend'),
        id: tableColumnInfo[3].id,
        sort: 'spec.suspend',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Concurrency policy'),
        id: tableColumnInfo[4].id,
        sort: 'spec.concurrencyPolicy',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Starting deadline seconds'),
        id: tableColumnInfo[5].id,
        sort: 'spec.startingDeadlineSeconds',
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

const CronJobDetails: React.FCC<CronJobDetailsProps> = ({ obj: cronjob }) => {
  const job = cronjob.spec.jobTemplate;
  const { t } = useTranslation();
  return (
    <>
      <PaneBody>
        <Grid hasGutter>
          <GridItem md={6}>
            <SectionHeading text={t('public~CronJob details')} />
            <ResourceSummary resource={cronjob}>
              <DetailsItem label={t('public~Schedule')} obj={cronjob} path="spec.schedule" />
              <DetailsItem label={t('public~Suspend')} obj={cronjob} path="spec.suspend">
                {cronjob.spec?.suspend ? t('public~True') : t('public~False')}
              </DetailsItem>
              <DetailsItem
                label={t('public~Concurrency policy')}
                obj={cronjob}
                path="spec.concurrencyPolicy"
              />
              <DetailsItem
                label={t('public~Start deadline seconds')}
                obj={cronjob}
                path="spec.startingDeadlineSeconds"
              >
                {cronjob.spec.startingDeadlineSeconds
                  ? t('public~{{count}} second', { count: cronjob.spec.startingDeadlineSeconds })
                  : t('public~Not configured')}
              </DetailsItem>
              <DetailsItem
                label={t('public~Last schedule time')}
                obj={cronjob}
                path="status.lastScheduleTime"
              >
                <Timestamp timestamp={cronjob.status.lastScheduleTime} />
              </DetailsItem>
            </ResourceSummary>
          </GridItem>
          <GridItem md={6}>
            <SectionHeading text={t('public~Job details')} />
            <DescriptionList>
              <DetailsItem
                label={t('public~Desired completions')}
                obj={cronjob}
                path="spec.jobTemplate.spec.completions"
              />
              <DetailsItem
                label={t('public~Parallelism')}
                obj={cronjob}
                path="spec.jobTemplate.spec.parallelism"
              />
              <DetailsItem
                label={t('public~Active deadline seconds')}
                obj={cronjob}
                path="spec.jobTemplate.spec.activeDeadlineSeconds"
              >
                {job.spec.activeDeadlineSeconds
                  ? t('public~{{count}} second', { count: job.spec.activeDeadlineSeconds })
                  : t('public~Not configured')}
              </DetailsItem>
              <PodDisruptionBudgetField obj={cronjob} />
            </DescriptionList>
          </GridItem>
        </Grid>
      </PaneBody>
      <PaneBody>
        <SectionHeading text={t('public~Containers')} />
        <ContainerTable containers={job.spec.template.spec.containers} />
      </PaneBody>
    </>
  );
};

export type CronJobPodsComponentProps = {
  obj: K8sResourceKind;
};

const getJobsWatcher = (namespace: string) => {
  return [
    {
      prop: 'jobs',
      isList: true,
      kind: 'Job',
      namespace,
    },
  ];
};

const getPodsWatcher = (namespace: string) => {
  return [
    ...getJobsWatcher(namespace),
    {
      prop: 'pods',
      isList: true,
      kind: 'Pod',
      namespace,
    },
  ];
};

export const CronJobPodsComponent: React.FCC<CronJobPodsComponentProps> = ({ obj }) => {
  const { t } = useTranslation();
  const podFilters = React.useMemo(() => getPodFilters(t), [t]);
  return (
    <PaneBody>
      <Firehose resources={getPodsWatcher(obj.metadata.namespace)}>
        <ListPageWrapper
          flatten={(
            _resources: FirehoseResourcesResult<{
              jobs: K8sResourceCommon[];
              pods: K8sResourceCommon[];
            }>,
          ) => {
            if (!_resources.jobs.loaded || !_resources.pods.loaded) {
              return [];
            }
            const jobs = _resources.jobs.data.filter((job) =>
              job.metadata?.ownerReferences?.find((ref) => ref.uid === obj.metadata.uid),
            );
            return (
              jobs &&
              jobs.reduce((acc, job) => {
                acc.push(...getPodsForResource(job, _resources));
                return acc;
              }, [])
            );
          }}
          kinds={['Pods']}
          ListComponent={PodList}
          rowFilters={podFilters}
          hideColumnManagement={true}
          omitFilterToolbar={true}
        />
      </Firehose>
    </PaneBody>
  );
};

export type CronJobJobsComponentProps = {
  obj: K8sResourceKind;
};

export const CronJobJobsComponent: React.FCC<CronJobJobsComponentProps> = ({ obj }) => (
  <PaneBody>
    <Firehose resources={getJobsWatcher(obj.metadata.namespace)}>
      <ListPageWrapper
        flatten={(_resources: FirehoseResourcesResult<{ jobs: K8sResourceCommon[] }>) => {
          if (!_resources.jobs.loaded) {
            return [];
          }
          return _resources.jobs.data.filter((job) =>
            job.metadata?.ownerReferences?.find((ref) => ref.uid === obj.metadata.uid),
          );
        }}
        kinds={['Jobs']}
        ListComponent={JobsList}
        hideColumnManagement={true}
        omitFilterToolbar={true}
      />
    </Firehose>
  </PaneBody>
);

export const CronJobsList: React.FCC<CronJobsListProps> = ({ data, loaded, ...props }) => {
  const columns = useCronJobsColumns();

  return (
    <React.Suspense fallback={<LoadingBox />}>
      <ResourceDataView<CronJobKind>
        {...props}
        label={CronJobModel.labelPlural}
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

export const CronJobsPage: React.FCC<CronJobsPageProps> = (props) => (
  <ListPage
    {...props}
    ListComponent={CronJobsList}
    kind={kind}
    canCreate={true}
    omitFilterToolbar={true}
  />
);

export const CronJobsDetailsPage: React.FCC = (props) => {
  const customActionMenu = (kindObj, obj) => {
    const resourceKind = referenceForModel(kindObj);
    const context = { [resourceKind]: obj };
    return (
      <ActionServiceProvider context={context}>
        {({ actions, options, loaded }) =>
          loaded && (
            <ActionMenu actions={actions} options={options} variant={ActionMenuVariant.DROPDOWN} />
          )
        }
      </ActionServiceProvider>
    );
  };
  return (
    <DetailsPage
      {...props}
      kind={kind}
      customActionMenu={customActionMenu}
      pages={[
        navFactory.details(CronJobDetails),
        navFactory.editYaml(),
        navFactory.pods(CronJobPodsComponent),
        navFactory.jobs(CronJobJobsComponent),
        navFactory.events(ResourceEventStream),
      ]}
    />
  );
};

type CronJobsListProps = {
  data: CronJobKind[];
  loaded: boolean;
  [key: string]: any;
};

type CronJobDetailsProps = {
  obj: CronJobKind;
};

type CronJobsPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};
