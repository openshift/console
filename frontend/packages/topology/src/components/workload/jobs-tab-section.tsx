import * as React from 'react';
import { GraphElement, Node } from '@patternfly/react-topology';
import { K8sResourceCommon } from '@console/dynamic-plugin-sdk/src';
import { CronJobModel } from '@console/internal/models';
import { useJobsForCronJobWatcher, SideBarTabSection } from '@console/shared';
import { TYPE_WORKLOAD } from '../../const';
import { getResource } from '../../utils';
import { JobsOverview } from './JobsOverview';

const JobsTabSection: React.FC<{ resource: K8sResourceCommon }> = ({ resource }) => {
  const { jobs } = useJobsForCronJobWatcher(resource);
  return (
    <SideBarTabSection>
      <JobsOverview obj={resource} jobs={jobs} />
    </SideBarTabSection>
  );
};

export const getJobsSideBarTabSection = (element: GraphElement) => {
  if (element.getType() !== TYPE_WORKLOAD) return undefined;
  const resource = getResource(element as Node);
  if (resource.kind !== CronJobModel.kind) return undefined;
  return <JobsTabSection resource={resource} />;
};
