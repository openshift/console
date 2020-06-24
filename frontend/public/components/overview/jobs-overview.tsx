import * as _ from 'lodash';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { getOwnedResources, PodStatus } from '@console/shared';
import { ResourceLink, resourcePath, SidebarSectionHeading } from '../utils';
import { K8sResourceKind, referenceFor, JobKind, PodKind } from '../../module/k8s';
import { ChartLabel } from '@patternfly/react-charts';

const kind: string = 'Job';
const MAX_JOBS: number = 3;

const JobOverviewItem: React.FC<JobOverviewItemProps> = ({ job, pods }) => {
  const {
    metadata: { name, namespace },
  } = job;
  const podsLink = `${resourcePath(referenceFor(job), name, namespace)}/pods`;

  const jobPods = getOwnedResources(job, pods) as PodKind[];
  return (
    <li className="list-group-item container-fluid">
      <div className="job-overview__item">
        <ResourceLink kind={kind} name={name} namespace={namespace} />
        <Link to={podsLink} className="overview__pod-donut-sm">
          <PodStatus
            standalone
            data={jobPods}
            size={25}
            innerRadius={8}
            outerRadius={12}
            title={`${jobPods.length}`}
            titleComponent={<ChartLabel style={{ fontSize: '10px' }} />}
            showTooltip={false}
          />
        </Link>
      </div>
    </li>
  );
};

JobOverviewItem.displayName = 'JobOverviewItem';

type JobOverviewItemProps = {
  job: JobKind;
  pods: PodKind[];
};

const JobsOverviewList: React.SFC<JobsOverviewListProps> = ({ jobs, pods }) => (
  <ul className="list-group">
    {_.map(jobs, (job) => (
      <JobOverviewItem key={job.metadata.uid} job={job} pods={pods} />
    ))}
  </ul>
);

JobsOverviewList.displayName = 'JobsOverviewList';

export const JobsOverview: React.SFC<JobsOverviewProps> = ({
  jobs,
  pods,
  obj,
  allJobsLink,
  emptyText,
}) => {
  const {
    metadata: { name, namespace },
  } = obj;
  const linkTo = allJobsLink || `${resourcePath(referenceFor(obj), name, namespace)}/jobs`;
  const emptyMessage = emptyText || 'No Jobs found for this resource.';

  return (
    <>
      <SidebarSectionHeading text="Jobs">
        {_.size(jobs) > MAX_JOBS && (
          <Link className="sidebar__section-view-all" to={linkTo}>
            {`View all (${_.size(jobs)})`}
          </Link>
        )}
      </SidebarSectionHeading>
      {_.isEmpty(jobs) ? (
        <span className="text-muted">{emptyMessage}</span>
      ) : (
        <JobsOverviewList jobs={_.take(jobs, MAX_JOBS)} pods={pods} />
      )}
    </>
  );
};

type JobsOverviewListProps = {
  jobs: JobKind[];
  pods: PodKind[];
};

type JobsOverviewProps = {
  jobs: JobKind[];
  pods: PodKind[];
  obj: K8sResourceKind;
  allJobsLink?: string;
  emptyText?: string;
};
