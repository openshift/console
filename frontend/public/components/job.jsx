import React from 'react';
import { Link } from 'react-router';

import { getJobTypeAndCompletions } from '../module/k8s';
import { ColHead, DetailsPage, List, ListHeader, ListPage, ResourceRow } from './factory';
import { configureJobParallelismModal } from './modals';
import { Cog, Heading, LabelList, ResourceCog, ResourceLink, ResourceSummary, Selector, Timestamp, navFactory } from './utils';

const ModifyJobParallelism = (kind, obj) => ({
  label: 'Modify Parallelism...',
  weight: 100,
  callback: () => configureJobParallelismModal({
    resourceKind: kind,
    resource: obj,
  }),
});
const menuActions = [ModifyJobParallelism, ...Cog.factory.common];

const JobHeader = props => <ListHeader>
  <ColHead {...props} className="col-md-2 col-sm-3 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-sm-3 col-xs-6" sortField="metadata.labels">Labels</ColHead>
  <ColHead {...props} className="col-md-2 col-sm-3 hidden-xs" sortFunc="jobCompletions">Completions</ColHead>
  <ColHead {...props} className="col-md-2 col-sm-3 hidden-xs" sortFunc="jobType">Type</ColHead>
  <ColHead {...props} className="col-md-3 hidden-sm hidden-xs" sortField="spec.selector">Pod Selector</ColHead>
</ListHeader>;

const JobRow = ({obj: job}) => {
  const {type, completions} = getJobTypeAndCompletions(job);
  return (
    <ResourceRow obj={job}>
      <div className="col-lg-2 col-md-2 col-sm-3 col-xs-6">
        <ResourceCog actions={menuActions} kind="job" resource={job} />
        <ResourceLink kind="job" name={job.metadata.name} namespace={job.metadata.namespace} title={job.metadata.uid} />
      </div>
      <div className="col-lg-3 col-md-3 col-sm-3 col-xs-6">
        <LabelList kind="job" labels={job.metadata.labels} />
      </div>
      <div className="col-lg-2 col-md-2 col-sm-3 hidden-xs">
        <Link to={`ns/${job.metadata.namespace}/jobs/${job.metadata.name}/pods`} title="pods">
          {job.status.succeeded || 0} of {completions}
        </Link>
      </div>
      <div className="col-lg-2 col-md-2 col-sm-3 hidden-xs">
        {type}
      </div>
      <div className="col-lg-3 col-md-3 hidden-sm hidden-xs">
        <Selector selector={job.spec.selector} />
      </div>
    </ResourceRow>
  );
};

const Details = (job) => <div>
  <div className="row no-gutter">
    <div className="col-md-6">
      <Heading text="Job Overview" />
      <div className="co-m-pane__body-group">
        <div className="co-m-pane__body-section--bordered">
          <ResourceSummary resource={job} showNodeSelector={false}>
            <dt>Desired Completions</dt>
            <dd>{job.spec.completions || '-'}</dd>
            <dt>Parallelism</dt>
            <dd>{job.spec.parallelism || '-'}</dd>
            <dt>Deadline</dt>
            <dd>{job.spec.activeDeadlineSeconds ? `${job.spec.activeDeadlineSeconds} seconds` : '-'}</dd>
          </ResourceSummary>
        </div>
      </div>
    </div>
    <div className="col-md-6">
      <Heading text="Job Status" />
      <div className="co-m-pane__body-group">
        <div className="co-m-pane__body-section--bordered">
          <dl>
            <dt>Status</dt>
            <dd>{job.status.conditions ? job.status.conditions[0].type : 'In Progress'}</dd>
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
  </div>
</div>;

const {details, pods, editYaml} = navFactory;
const JobsDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={[details(Details), editYaml(), pods()]}
/>;
const JobsList = props => <List {...props} Header={JobHeader} Row={JobRow} />;
const JobsPage = props => <ListPage ListComponent={JobsList} canCreate={true} {...props} />;
export {JobsList, JobsPage, JobsDetailsPage};
