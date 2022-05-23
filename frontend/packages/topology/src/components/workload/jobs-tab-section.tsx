import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { K8sResourceCommon } from '@console/dynamic-plugin-sdk/src';
import { DetailsTabSectionExtensionHook } from '@console/dynamic-plugin-sdk/src/extensions/topology-details';
import { CronJobModel } from '@console/internal/models';
import { useJobsForCronJobWatcher } from '@console/shared';
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

export const useJobsSideBarTabSection: DetailsTabSectionExtensionHook = (element: GraphElement) => {
  const resource = getResource(element);
  if (!resource || resource.kind !== CronJobModel.kind) {
    return [undefined, true, undefined];
  }
  const section = <JobsTabSection resource={resource} />;
  return [section, true, undefined];
};
