import * as React from 'react';
import { Link } from 'react-router-dom';

import { getJobTypeAndCompletions } from '../module/k8s';
import { ColHead, DetailsPage, List, ListHeader, ListPage, ResourceRow } from './factory';
import { configureJobParallelismModal } from './modals';
import { Kebab, ContainerTable, SectionHeading, LabelList, ResourceKebab, ResourceLink, ResourceSummary, Timestamp, navFactory, StatusIconAndText } from './utils';
import { ResourceEventStream } from './events';

const ModifyJobParallelism = (kind, obj) => ({
  label: 'Edit Parallelism',
  callback: () => configureJobParallelismModal({
    resourceKind: kind,
    resource: obj,
  }),
  accessReview: {
    group: kind.apiGroup,
    resource: kind.path,
    name: obj.metadata.name,
    namespace: obj.metadata.namespace,
    verb: 'patch',
  },
});
const menuActions = [ModifyJobParallelism, ...Kebab.factory.common];

const JobHeader = props => <ListHeader>
  <ColHead {...props} className="col-lg-2 col-md-3 col-sm-4 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-3 col-sm-4 col-xs-6" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-lg-4 col-md-4 col-sm-4 hidden-xs" sortField="metadata.labels">Labels</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-2 hidden-sm hidden-xs" sortFunc="jobCompletions">Completions</ColHead>
  <ColHead {...props} className="col-lg-2 hidden-md hidden-sm hidden-xs" sortFunc="jobType">Type</ColHead>
</ListHeader>;

const JobRow = ({obj: job}) => {
  const {type, completions} = getJobTypeAndCompletions(job);
  return (
    <ResourceRow obj={job}>
      <div className="col-lg-2 col-md-3 col-sm-4 col-xs-6">
        <ResourceLink kind="Job" name={job.metadata.name} namespace={job.metadata.namespace} title={job.metadata.uid} />
      </div>
      <div className="col-lg-2 col-md-3 col-sm-4 col-xs-6 co-break-word">
        <ResourceLink kind="Namespace" name={job.metadata.namespace} title={job.metadata.namespace} />
      </div>
      <div className="col-lg-4 col-md-4 col-sm-4 hidden-xs">
        <LabelList kind="Job" labels={job.metadata.labels} />
      </div>
      <div className="col-lg-2 col-md-2 hidden-sm hidden-xs">
        <Link to={`/k8s/ns/${job.metadata.namespace}/jobs/${job.metadata.name}/pods`} title="pods">
          {job.status.succeeded || 0} of {completions}
        </Link>
      </div>
      <div className="col-lg-2 hidden-md hidden-sm hidden-xs">
        {type}
      </div>
      <div className="dropdown-kebab-pf">
        <ResourceKebab actions={menuActions} kind="Job" resource={job} />
      </div>
    </ResourceRow>
  );
};

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
          <dd>{job.status.conditions ? <StatusIconAndText status={job.status.conditions[0].type} /> : <StatusIconAndText status="In Progress" />}</dd>
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
const JobsList = props => <List {...props} Header={JobHeader} Row={JobRow} />;
const JobsPage = props => <ListPage ListComponent={JobsList} canCreate={true} {...props} />;
export {JobsList, JobsPage, JobsDetailsPage};
