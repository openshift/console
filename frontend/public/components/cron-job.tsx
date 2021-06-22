import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { getPodsForResource } from '@console/shared';
import {
  DetailsPage,
  ListPage,
  Table,
  TableRow,
  TableData,
  RowFunction,
  ListPageWrapper_ as ListPageWrapper,
} from './factory';
import { CronJobKind, K8sResourceKind } from '../module/k8s';
import {
  ContainerTable,
  DetailsItem,
  Firehose,
  Kebab,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  Timestamp,
  navFactory,
} from './utils';
import { ResourceEventStream } from './events';
import { CronJobModel } from '../models';
import { PodList, getFilters as getPodFilters } from './pod';
import { JobsList } from './job';

const { common } = Kebab.factory;
export const menuActions = [...Kebab.getExtensionsActionsForKind(CronJobModel), ...common];

const kind = 'CronJob';

const tableColumnClasses = [
  '',
  '',
  'pf-m-hidden pf-m-visible-on-md',
  'pf-m-hidden pf-m-visible-on-lg pf-u-w-25-on-xl',
  'pf-m-hidden pf-m-visible-on-xl pf-u-w-25-on-xl',
  Kebab.columnClass,
];

const CronJobTableRow: RowFunction<CronJobKind> = ({ obj: cronjob, index, key, style }) => {
  return (
    <TableRow id={cronjob.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={kind}
          name={cronjob.metadata.name}
          title={cronjob.metadata.name}
          namespace={cronjob.metadata.namespace}
        />
      </TableData>
      <TableData
        className={classNames(tableColumnClasses[1], 'co-break-word')}
        columnID="namespace"
      >
        <ResourceLink
          kind="Namespace"
          name={cronjob.metadata.namespace}
          title={cronjob.metadata.namespace}
        />
      </TableData>
      <TableData className={tableColumnClasses[2]}>{cronjob.spec.schedule}</TableData>
      <TableData className={tableColumnClasses[3]}>
        {_.get(cronjob.spec, 'concurrencyPolicy', '-')}
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        {_.get(cronjob.spec, 'startingDeadlineSeconds', '-')}
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={cronjob} />
      </TableData>
    </TableRow>
  );
};

const CronJobDetails: React.FC<CronJobDetailsProps> = ({ obj: cronjob }) => {
  const job = cronjob.spec.jobTemplate;
  const { t } = useTranslation();
  return (
    <>
      <div className="co-m-pane__body">
        <div className="row">
          <div className="col-md-6">
            <SectionHeading text={t('public~CronJob details')} />
            <ResourceSummary resource={cronjob}>
              <DetailsItem label={t('public~Schedule')} obj={cronjob} path="spec.schedule" />
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
          </div>
          <div className="col-md-6">
            <SectionHeading text={t('public~Job details')} />
            <dl className="co-m-pane__details">
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
            </dl>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('public~Containers')} />
        <ContainerTable containers={job.spec.template.spec.containers} />
      </div>
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

export const CronJobPodsComponent: React.FC<CronJobPodsComponentProps> = ({ obj }) => (
  <div className="co-m-pane__body">
    <Firehose resources={getPodsWatcher(obj.metadata.namespace)}>
      <ListPageWrapper
        flatten={(_resources) => {
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
        rowFilters={getPodFilters()}
      />
    </Firehose>
  </div>
);

export type CronJobJobsComponentProps = {
  obj: K8sResourceKind;
};

export const CronJobJobsComponent: React.FC<CronJobJobsComponentProps> = ({ obj }) => (
  <div className="co-m-pane__body">
    <Firehose resources={getJobsWatcher(obj.metadata.namespace)}>
      <ListPageWrapper
        flatten={(_resources) => {
          if (!_resources.jobs.loaded) {
            return [];
          }
          return _resources.jobs.data.filter((job) =>
            job.metadata?.ownerReferences?.find((ref) => ref.uid === obj.metadata.uid),
          );
        }}
        kinds={['Jobs']}
        ListComponent={JobsList}
      />
    </Firehose>
  </div>
);

export const CronJobsList: React.FC = (props) => {
  const { t } = useTranslation();
  const CronJobTableHeader = () => [
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
      title: t('public~Schedule'),
      sortField: 'spec.schedule',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: t('public~Concurrency policy'),
      sortField: 'spec.concurrencyPolicy',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: t('public~Starting deadline seconds'),
      sortField: 'spec.startingDeadlineSeconds',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[5] },
    },
  ];

  return (
    <Table
      {...props}
      aria-label={CronJobModel.labelPlural}
      Header={CronJobTableHeader}
      Row={CronJobTableRow}
      virtualize
    />
  );
};

export const CronJobsPage: React.FC<CronJobsPageProps> = (props) => (
  <ListPage {...props} ListComponent={CronJobsList} kind={kind} canCreate={true} />
);

export const CronJobsDetailsPage: React.FC<CronJobsDetailsPageProps> = (props) => (
  <DetailsPage
    {...props}
    kind={kind}
    menuActions={menuActions}
    pages={[
      navFactory.details(CronJobDetails),
      navFactory.editYaml(),
      navFactory.pods(CronJobPodsComponent),
      navFactory.jobs(CronJobJobsComponent),
      navFactory.events(ResourceEventStream),
    ]}
  />
);

type CronJobDetailsProps = {
  obj: CronJobKind;
};

type CronJobsPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type CronJobsDetailsPageProps = {
  match: any;
};
