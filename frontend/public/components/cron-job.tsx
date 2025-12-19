import * as React from 'react';
import type { RowFilter } from '@console/dynamic-plugin-sdk';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { DASH } from '@console/shared/src/constants/ui';
import { getPodsForResource } from '@console/shared/src/utils/resource-utils';
import ActionServiceProvider from '@console/shared/src/components/actions/ActionServiceProvider';
import ActionMenu from '@console/shared/src/components/actions/menu/ActionMenu';
import { ActionMenuVariant } from '@console/shared/src/components/actions/types';
import LazyActionMenu from '@console/shared/src/components/actions/LazyActionMenu';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { DetailsPage } from './factory/details';
import { ListPage, ListPageWrapper } from './factory/list-page';
import {
  CronJobKind,
  K8sResourceCommon,
  K8sResourceKind,
  referenceForModel,
  referenceFor,
  TableColumn,
  podPhaseFilterReducer,
  PodKind,
} from '../module/k8s';
import { ContainerTable } from './utils/container-table';
import { DetailsItem } from './utils/details-item';
import { Firehose } from './utils/firehose';
import { FirehoseResourcesResult } from './utils/types';
import { ResourceLink } from './utils/resource-link';
import { ResourceSummary } from './utils/details-page';
import { SectionHeading } from './utils/headings';
import { navFactory } from './utils/horizontal-nav';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { ResourceEventStream } from './events';
import { CronJobModel } from '../models';
import { PodList } from './pod-list';
import { JobsList } from './job';
import { PodDisruptionBudgetField } from '@console/app/src/components/pdb/PodDisruptionBudgetField';
import { DescriptionList, Grid, GridItem } from '@patternfly/react-core';
import {
  actionsCellProps,
  cellIsStickyProps,
  getNameCellProps,
  ConsoleDataView,
} from '@console/app/src/components/data-view/ConsoleDataView';
import { GetDataViewRows } from '@console/app/src/components/data-view/types';
import { getGroupVersionKindForModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import { LoadingBox } from './utils/status-box';
import * as _ from 'lodash';

const kind = referenceForModel(CronJobModel);

const getPodFilters = (t: TFunction): RowFilter<PodKind>[] => [
  {
    filterGroupName: t('public~Status'),
    type: 'pod-status',
    filter: (phases, pod) => {
      if (!phases || !phases.selected || !phases.selected.length) {
        return true;
      }
      const phase = podPhaseFilterReducer(pod);
      return phases.selected.includes(phase) || !_.includes(phases.all, phase);
    },
    reducer: podPhaseFilterReducer,
    items: [
      { id: 'Running', title: t('public~Running') },
      { id: 'Pending', title: t('public~Pending') },
      { id: 'Terminating', title: t('public~Terminating') },
      { id: 'CrashLoopBackOff', title: t('public~CrashLoopBackOff') },
      // Use title "Completed" to match what appears in the status column for the pod.
      // The pod phase is "Succeeded," but the container state is "Completed."
      { id: 'Succeeded', title: t('public~Completed') },
      { id: 'Failed', title: t('public~Failed') },
      { id: 'Unknown', title: t('public~Unknown') },
    ],
  },
];

const tableColumnInfo = [
  { id: 'name' },
  { id: 'namespace' },
  { id: 'schedule' },
  { id: 'suspend' },
  { id: 'concurrencyPolicy' },
  { id: 'startingDeadlineSeconds' },
  { id: 'actions' },
];

const BooleanDisplay: Snail.FCC<{ value?: boolean }> = ({ value }) => {
  const { t } = useTranslation();
  return value ? t('public~True') : t('public~False');
};

const getDataViewRows: GetDataViewRows<CronJobKind> = (data, columns) => {
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
        cell: cronjob.spec.schedule,
      },
      [tableColumnInfo[3].id]: {
        cell: <BooleanDisplay value={cronjob.spec?.suspend} />,
      },
      [tableColumnInfo[4].id]: {
        cell: cronjob.spec?.concurrencyPolicy || DASH,
      },
      [tableColumnInfo[5].id]: {
        cell: cronjob.spec?.startingDeadlineSeconds || DASH,
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

const CronJobDetails: Snail.FCC<CronJobDetailsProps> = ({ obj: cronjob }) => {
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
                <BooleanDisplay value={cronjob.spec?.suspend} />
              </DetailsItem>
              <DetailsItem
                label={t('public~Concurrency policy')}
                obj={cronjob}
                path="spec.concurrencyPolicy"
              />
              <DetailsItem
                label={t('public~Starting deadline seconds')}
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

export const CronJobPodsComponent: Snail.FCC<CronJobPodsComponentProps> = ({ obj }) => {
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

export const CronJobJobsComponent: Snail.FCC<CronJobJobsComponentProps> = ({ obj }) => (
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

export const CronJobsList: Snail.FCC<CronJobsListProps> = ({ data, loaded, ...props }) => {
  const columns = useCronJobsColumns();

  return (
    <React.Suspense fallback={<LoadingBox />}>
      <ConsoleDataView<CronJobKind>
        {...props}
        label={CronJobModel.labelPlural}
        data={data}
        loaded={loaded}
        columns={columns}
        getDataViewRows={getDataViewRows}
        hideColumnManagement={true}
      />
    </React.Suspense>
  );
};

export const CronJobsPage: Snail.FCC<CronJobsPageProps> = (props) => (
  <ListPage
    {...props}
    ListComponent={CronJobsList}
    kind={kind}
    canCreate={true}
    omitFilterToolbar={true}
  />
);

export const CronJobsDetailsPage: Snail.FCC = (props) => {
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
