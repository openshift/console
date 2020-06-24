import * as React from 'react';
import * as _ from 'lodash';
import { Link } from 'react-router-dom';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

import { Status } from '@console/shared';
import { getJobTypeAndCompletions, K8sKind, JobKind, K8sResourceKind } from '../module/k8s';
import { Conditions } from './conditions';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from './factory';
import { configureJobParallelismModal } from './modals';
import {
  ContainerTable,
  DetailsItem,
  Kebab,
  KebabAction,
  LabelList,
  PodsComponent,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  Timestamp,
  navFactory,
  pluralize,
} from './utils';
import { ResourceEventStream } from './events';
import { JobModel } from '../models';

const ModifyJobParallelism: KebabAction = (kind: K8sKind, obj: JobKind) => ({
  label: 'Edit Parallelism',
  callback: () =>
    configureJobParallelismModal({
      resourceKind: kind,
      resource: obj,
    }),
  accessReview: {
    group: kind.apiGroup,
    resource: kind.plural,
    name: obj.metadata.name,
    namespace: obj.metadata.namespace,
    verb: 'patch',
  },
});
export const menuActions: KebabAction[] = [
  ModifyJobParallelism,
  ...Kebab.getExtensionsActionsForKind(JobModel),
  ...Kebab.factory.common,
];

const kind = 'Job';

const tableColumnClasses = [
  classNames('col-lg-2', 'col-md-3', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-2', 'col-md-3', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-4', 'col-md-4', 'col-sm-4', 'hidden-xs'),
  classNames('col-lg-2', 'col-md-2', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-2', 'hidden-md', 'hidden-sm', 'hidden-xs'),
  Kebab.columnClass,
];

const JobTableHeader = () => {
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
    },
    {
      title: 'Labels',
      sortField: 'metadata.labels',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Completions',
      sortFunc: 'jobCompletions',
      transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Type',
      sortFunc: 'jobType',
      transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: '',
      props: { className: tableColumnClasses[5] },
    },
  ];
};
JobTableHeader.displayName = 'JobTableHeader';

const JobTableRow: RowFunction<JobKind> = ({ obj: job, index, key, style }) => {
  const { type, completions } = getJobTypeAndCompletions(job);
  return (
    <TableRow id={job.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={kind}
          name={job.metadata.name}
          namespace={job.metadata.namespace}
          title={job.metadata.uid}
        />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink
          kind="Namespace"
          name={job.metadata.namespace}
          title={job.metadata.namespace}
        />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <LabelList kind={kind} labels={job.metadata.labels} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <Link to={`/k8s/ns/${job.metadata.namespace}/jobs/${job.metadata.name}/pods`} title="pods">
          {job.status.succeeded || 0} of {completions}
        </Link>
      </TableData>
      <TableData className={tableColumnClasses[4]}>{type}</TableData>
      <TableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={menuActions} kind="Job" resource={job} />
      </TableData>
    </TableRow>
  );
};

const jobStatus = (job: JobKind): string => {
  return job && job.status ? _.get(job, 'status.conditions[0].type', 'In Progress') : null;
};

export const JobDetails: React.FC<JobsDetailsProps> = ({ obj: job }) => (
  <>
    <div className="co-m-pane__body">
      <div className="row">
        <div className="col-md-6">
          <SectionHeading text="Job Details" />
          <ResourceSummary resource={job} showPodSelector>
            <DetailsItem label="Desired Completions" obj={job} path="spec.completions" />
            <DetailsItem label="Parallelism" obj={job} path="spec.parallelism" />
            <DetailsItem
              label="Active Deadline Seconds"
              obj={job}
              path="spec.activeDeadlineSeconds"
            >
              {job.spec.activeDeadlineSeconds
                ? pluralize(job.spec.activeDeadlineSeconds, 'second')
                : 'Not Configured'}
            </DetailsItem>
          </ResourceSummary>
        </div>
        <div className="col-md-6">
          <SectionHeading text="Job Status" />
          <dl className="co-m-pane__details">
            <dt>Status</dt>
            <dd>
              <Status status={jobStatus(job)} />
            </dd>
            <DetailsItem label="Start Time" obj={job} path="status.startTime">
              <Timestamp timestamp={job.status.startTime} />
            </DetailsItem>
            <DetailsItem label="Completion Time" obj={job} path="status.completionTime">
              <Timestamp timestamp={job.status.completionTime} />
            </DetailsItem>
            <DetailsItem
              label="Succeeded Pods"
              obj={job}
              path="status.succeeded"
              defaultValue="0"
            />
            <DetailsItem label="Active Pods" obj={job} path="status.active" defaultValue="0" />
            <DetailsItem label="Failed Pods" obj={job} path="status.failed" defaultValue="0" />
          </dl>
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
      <SectionHeading text="Containers" />
      <ContainerTable containers={job.spec.template.spec.containers} />
    </div>
    <div className="co-m-pane__body">
      <SectionHeading text="Conditions" />
      <Conditions conditions={job.status.conditions} />
    </div>
  </>
);

const JobPods: React.FC<JobPodsProps> = (props) => (
  <PodsComponent {...props} customData={{ showNodes: true }} />
);

const { details, pods, editYaml, events } = navFactory;
const JobsDetailsPage: React.FC<JobsDetailsPageProps> = (props) => (
  <DetailsPage
    {...props}
    getResourceStatus={jobStatus}
    kind={kind}
    menuActions={menuActions}
    pages={[details(JobDetails), editYaml(), pods(JobPods), events(ResourceEventStream)]}
  />
);
const JobsList: React.FC = (props) => (
  <Table
    {...props}
    aria-label={JobModel.labelPlural}
    Header={JobTableHeader}
    Row={JobTableRow}
    virtualize
  />
);

const JobsPage: React.FC<JobsPageProps> = (props) => (
  <ListPage ListComponent={JobsList} kind={kind} canCreate={true} {...props} />
);
export { JobsList, JobsPage, JobsDetailsPage };

type JobsDetailsProps = {
  obj: JobKind;
};

type JobsPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

type JobPodsProps = {
  obj: K8sResourceKind;
};

type JobsDetailsPageProps = {
  match: any;
};
