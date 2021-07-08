import * as _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PodStatus, usePodsWatcher } from '@console/shared';
import { ResourceLink, resourcePath, SidebarSectionHeading } from '../utils';
import { K8sResourceKind, referenceFor, JobKind } from '../../module/k8s';
import { ChartLabel } from '@patternfly/react-charts';

const kind: string = 'Job';
const MAX_JOBS: number = 3;

const JobOverviewItem: React.FC<JobOverviewItemProps> = ({ job }) => {
  const {
    metadata: { name, namespace },
  } = job;
  const podsLink = `${resourcePath(referenceFor(job), name, namespace)}/pods`;
  const { podData, loaded, loadError } = usePodsWatcher(job, 'Job', namespace);

  return loaded && !loadError ? (
    <li className="list-group-item container-fluid">
      <div className="job-overview__item">
        <ResourceLink kind={kind} name={name} namespace={namespace} />
        <Link to={podsLink} className="overview__pod-donut-sm">
          <PodStatus
            standalone
            data={podData.pods}
            size={25}
            innerRadius={8}
            outerRadius={12}
            title={`${podData.pods.length}`}
            titleComponent={<ChartLabel style={{ fontSize: '10px' }} />}
            showTooltip={false}
          />
        </Link>
      </div>
    </li>
  ) : null;
};

JobOverviewItem.displayName = 'JobOverviewItem';

type JobOverviewItemProps = {
  job: JobKind;
};

const JobsOverviewList: React.SFC<JobsOverviewListProps> = ({ jobs }) => (
  <ul className="list-group">
    {_.map(jobs, (job) => (
      <JobOverviewItem key={job.metadata.uid} job={job} />
    ))}
  </ul>
);

JobsOverviewList.displayName = 'JobsOverviewList';

export const JobsOverview: React.SFC<JobsOverviewProps> = ({
  jobs,
  obj,
  allJobsLink,
  emptyText,
}) => {
  const {
    metadata: { name, namespace },
  } = obj;
  const { t } = useTranslation();
  const linkTo = allJobsLink || `${resourcePath(referenceFor(obj), name, namespace)}/jobs`;
  const emptyMessage = emptyText || t('public~No Jobs found for this resource.');

  return (
    <>
      <SidebarSectionHeading text="Jobs">
        {_.size(jobs) > MAX_JOBS && (
          <Link className="sidebar__section-view-all" to={linkTo}>
            {t('public~View all ({{jobCount}})', { jobCount: _.size(jobs) })}
          </Link>
        )}
      </SidebarSectionHeading>
      {_.isEmpty(jobs) ? (
        <span className="text-muted">{emptyMessage}</span>
      ) : (
        <JobsOverviewList jobs={_.take(jobs, MAX_JOBS)} />
      )}
    </>
  );
};

type JobsOverviewListProps = {
  jobs: JobKind[];
};

type JobsOverviewProps = {
  jobs: JobKind[];
  obj: K8sResourceKind;
  allJobsLink?: string;
  emptyText?: string;
};
