import * as React from 'react';
import { ChartLabel } from '@patternfly/react-charts';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  ResourceLink,
  resourcePath,
  SidebarSectionHeading,
} from '@console/internal/components/utils';
import { K8sResourceKind, referenceFor, JobKind } from '@console/internal/module/k8s';
import { PodStatus, usePodsWatcher } from '@console/shared';

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

const JobsOverviewList: React.FC<JobsOverviewListProps> = ({ jobs }) => (
  <ul className="list-group">
    {jobs?.map((job) => (
      <JobOverviewItem key={job.metadata.uid} job={job} />
    ))}
  </ul>
);

JobsOverviewList.displayName = 'JobsOverviewList';

export const JobsOverview: React.FC<JobsOverviewProps> = ({
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
  const emptyMessage = emptyText || t('topology~No Jobs found for this resource.');

  return (
    <>
      <SidebarSectionHeading text="Jobs">
        {jobs?.length > MAX_JOBS && (
          <Link className="sidebar__section-view-all" to={linkTo}>
            {t('topology~View all ({{jobCount}})', { jobCount: jobs.length })}
          </Link>
        )}
      </SidebarSectionHeading>
      {!(jobs?.length > 0) ? (
        <span className="text-muted">{emptyMessage}</span>
      ) : (
        <JobsOverviewList jobs={jobs.slice(0, MAX_JOBS)} />
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
