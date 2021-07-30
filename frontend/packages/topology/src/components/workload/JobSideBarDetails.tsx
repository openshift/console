import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import {
  DetailsItem,
  ResourceSummary,
  StatusBox,
  pluralize,
} from '@console/internal/components/utils';
import { JobModel } from '@console/internal/models';
import { JobKind } from '@console/internal/module/k8s';
import { usePodsWatcher } from '@console/shared/src';
import PodRingSet from '@console/shared/src/components/pod/PodRingSet';
import { TYPE_WORKLOAD } from '../../const';
import { getResource } from '../../utils';

type JobSideBarDetailsProps = {
  job: JobKind;
};

const JobSideBarDetails: React.FC<JobSideBarDetailsProps> = ({ job }) => {
  const { namespace } = job.metadata;
  const { podData, loaded, loadError } = usePodsWatcher(job, 'Job', namespace);
  const { t } = useTranslation();
  return (
    <div className="overview__sidebar-pane-body resource-overview__body">
      <div className="resource-overview__pod-counts">
        <StatusBox loaded={loaded} data={podData} loadError={loadError}>
          <PodRingSet key={job.metadata.uid} obj={job} path="" />
        </StatusBox>
      </div>
      <ResourceSummary resource={job} showPodSelector>
        <DetailsItem label={t('topology~Desired completions')} obj={job} path="spec.completions" />
        <DetailsItem label={t('topology~Parallelism')} obj={job} path="spec.parallelism" />
        <DetailsItem
          label={t('topology~Active deadline seconds')}
          obj={job}
          path="spec.activeDeadlineSeconds"
        >
          {job.spec?.activeDeadlineSeconds
            ? pluralize(job.spec.activeDeadlineSeconds, 'second')
            : t('topology~Not configured')}
        </DetailsItem>
      </ResourceSummary>
    </div>
  );
};

export const getJobSideBarDetails = (element: GraphElement) => {
  if (element.getType() !== TYPE_WORKLOAD) return undefined;
  const resource = getResource<JobKind>(element);
  if (resource.kind !== JobModel.kind) return undefined;
  return <JobSideBarDetails job={resource} />;
};
