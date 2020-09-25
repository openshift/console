import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

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
  pluralize,
} from './utils';
import { ResourceEventStream } from './events';
import { CronJobModel } from '../models';
import { PodList, filters as PodFilters } from './pod';
import { JobsList } from './job';

const { common } = Kebab.factory;
export const menuActions = [...Kebab.getExtensionsActionsForKind(CronJobModel), ...common];

const kind = 'CronJob';

const tableColumnClasses = [
  classNames('col-lg-2', 'col-md-3', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-2', 'col-md-3', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-2', 'col-md-3', 'col-sm-4', 'hidden-xs'),
  classNames('col-lg-3', 'col-md-3', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-3', 'hidden-md', 'hidden-sm', 'hidden-xs'),
  Kebab.columnClass,
];

const CronJobTableHeader = () => {
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
      title: 'Schedule',
      sortField: 'spec.schedule',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Concurrency Policy',
      sortField: 'spec.concurrencyPolicy',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Starting Deadline Seconds',
      sortField: 'spec.startingDeadlineSeconds',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[5] },
    },
  ];
};
CronJobTableHeader.displayName = 'CronJobTableHeader';

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
  return (
    <>
      <div className="co-m-pane__body">
        <div className="row">
          <div className="col-md-6">
            <SectionHeading text="CronJob Details" />
            <ResourceSummary resource={cronjob}>
              <DetailsItem label="Schedule" obj={cronjob} path="spec.schedule" />
              <DetailsItem label="Concurrency Policy" obj={cronjob} path="spec.concurrencyPolicy" />
              <DetailsItem
                label="Starting Deadline Seconds"
                obj={cronjob}
                path="spec.startingDeadlineSeconds"
              >
                {cronjob.spec.startingDeadlineSeconds
                  ? pluralize(cronjob.spec.startingDeadlineSeconds, 'second')
                  : 'Not Configured'}
              </DetailsItem>
              <DetailsItem label="Last Schedule Time" obj={cronjob} path="status.lastScheduleTime">
                <Timestamp timestamp={cronjob.status.lastScheduleTime} />
              </DetailsItem>
            </ResourceSummary>
          </div>
          <div className="col-md-6">
            <SectionHeading text="Job Details" />
            <dl className="co-m-pane__details">
              <DetailsItem
                label="Desired Completions"
                obj={cronjob}
                path="spec.jobTemplate.spec.completions"
              />
              <DetailsItem
                label="Parallelism"
                obj={cronjob}
                path="spec.jobTemplate.spec.parallelism"
              />
              <DetailsItem
                label="Active Deadline Seconds"
                obj={cronjob}
                path="spec.jobTemplate.spec.activeDeadlineSeconds"
              >
                {job.spec.activeDeadlineSeconds
                  ? pluralize(job.spec.activeDeadlineSeconds, 'second')
                  : 'Not Configured'}
              </DetailsItem>
            </dl>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text="Containers" />
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
        rowFilters={PodFilters}
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

export const CronJobsList: React.FC = (props) => (
  <Table
    {...props}
    aria-label={CronJobModel.labelPlural}
    Header={CronJobTableHeader}
    Row={CronJobTableRow}
    virtualize
  />
);

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
