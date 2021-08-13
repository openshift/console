import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { K8sResourceCommon } from '@console/dynamic-plugin-sdk/src';
import { CronJobModel } from '@console/internal/models';
import { useJobsForCronJobWatcher } from '@console/shared';
import { TYPE_WORKLOAD } from '../../const';
import { getResource } from '../../utils';
import TopologySideBarTabSection from '../side-bar/TopologySideBarTabSection';
import { JobsOverview } from './JobsOverview';

const JobsTabSection: React.FC<{ resource: K8sResourceCommon }> = ({ resource }) => {
  const { jobs } = useJobsForCronJobWatcher(resource);
  return (
    <TopologySideBarTabSection>
      <JobsOverview obj={resource} jobs={jobs} />
    </TopologySideBarTabSection>
  );
};

export const getJobsSideBarTabSection = (element: GraphElement) => {
  if (element.getType() !== TYPE_WORKLOAD) return undefined;
  const resource = getResource(element);
  if (resource.kind !== CronJobModel.kind) return undefined;
  return <JobsTabSection resource={resource} />;
};
