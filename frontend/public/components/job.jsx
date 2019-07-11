import * as React from 'react';
import { Link } from 'react-router-dom';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';

import { Status } from '@console/shared';
import { getJobTypeAndCompletions } from '../module/k8s';
import { DetailsPage, ListPage, VirtualTable, VirtualTableRow, VirtualTableData } from './factory';
import { configureJobParallelismModal } from './modals';
import { Kebab, ContainerTable, SectionHeading, LabelList, ResourceKebab, ResourceLink, ResourceSummary, Timestamp, navFactory } from './utils';
import { ResourceEventStream } from './events';

const ModifyJobParallelism = (kind, obj) => ({
  label: 'Edit Parallelism',
  callback: () => configureJobParallelismModal({
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
const menuActions = [ModifyJobParallelism, ...Kebab.factory.common];

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
      title: 'Completions', sortFunc: 'jobCompletions', transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Type', sortFunc: 'jobType', transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: '', props: { className: tableColumnClasses[5] },
    },
  ];
};
JobTableHeader.displayName = 'JobTableHeader';

const JobTableRow = ({obj: job, index, key, style}) => {
  const {type, completions} = getJobTypeAndCompletions(job);
  return (
    <VirtualTableRow id={job.metadata.uid} index={index} trKey={key} style={style}>
      <VirtualTableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={job.metadata.name} namespace={job.metadata.namespace} title={job.metadata.uid} />
      </VirtualTableData>
      <VirtualTableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink kind="Namespace" name={job.metadata.namespace} title={job.metadata.namespace} />
      </VirtualTableData>
      <VirtualTableData className={tableColumnClasses[2]}>
        <LabelList kind={kind} labels={job.metadata.labels} />
      </VirtualTableData>
      <VirtualTableData className={tableColumnClasses[3]}>
        <Link to={`/k8s/ns/${job.metadata.namespace}/jobs/${job.metadata.name}/pods`} title="pods">
          {job.status.succeeded || 0} of {completions}
        </Link>
      </VirtualTableData>
      <VirtualTableData className={tableColumnClasses[4]}>{type}</VirtualTableData>
      <VirtualTableData className={tableColumnClasses[5]}>
        <ResourceKebab actions={menuActions} kind="Job" resource={job} />
      </VirtualTableData>
    </VirtualTableRow>
  );
};
JobTableRow.displayName = 'JobTableRow';

const Details = ({obj: job}) => <React.Fragment>
  <div className="co-m-pane__body">
    <div className="row">
      <div className="col-md-6">
        <SectionHeading text="Job Overview" />
        <ResourceSummary resource={job} showPodSelector>
          <dt>Desired Completions</dt>
          <dd>{job.spec.completions || '-'}</dd>
          <dt>Parallelism</dt>
          <dd>{job.spec.parallelism || '-'}</dd>
          <dt>Deadline</dt>
          <dd>{job.spec.activeDeadlineSeconds ? `${job.spec.activeDeadlineSeconds} seconds` : '-'}</dd>
        </ResourceSummary>
      </div>
      <div className="col-md-6">
        <SectionHeading text="Job Status" />
        <dl className="co-m-pane__details">
          <dt>Status</dt>
          <dd>{job.status.conditions ? <Status status={job.status.conditions[0].type} /> : <Status status="In Progress" />}</dd>
          <dt>Start Time</dt>
          <dd><Timestamp timestamp={job.status.startTime} /></dd>
          <dt>Completion Time</dt>
          <dd><Timestamp timestamp={job.status.completionTime} /></dd>
          <dt>Succeeded Pods</dt>
          <dd>{job.status.succeeded || 0}</dd>
          <dt>Active Pods</dt>
          <dd>{job.status.active || 0}</dd>
          <dt>Failed Pods</dt>
          <dd>{job.status.failed || 0}</dd>
        </dl>
      </div>
    </div>
  </div>
  <div className="co-m-pane__body">
    <SectionHeading text="Containers" />
    <ContainerTable containers={job.spec.template.spec.containers} />
  </div>
</React.Fragment>;

const {details, pods, editYaml, events} = navFactory;
const JobsDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={[details(Details), editYaml(), pods(), events(ResourceEventStream)]}
/>;
const JobsList = props => <VirtualTable {...props} aria-label="Jobs" Header={JobTableHeader} Row={JobTableRow} />;

const JobsPage = props => <ListPage ListComponent={JobsList} canCreate={true} {...props} />;
export {JobsList, JobsPage, JobsDetailsPage};
