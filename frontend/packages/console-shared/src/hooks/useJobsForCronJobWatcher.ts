import { useState, useMemo } from 'react';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import type { K8sResourceKind, JobKind } from '@console/internal/module/k8s';
import { getJobsForCronJob } from '../utils/resource-utils';

export const useJobsForCronJobWatcher = (
  cronJob: K8sResourceKind,
): { loaded: boolean; loadError: string; jobs: JobKind[] } => {
  const { namespace, uid } = cronJob.metadata;
  const [loaded, setLoaded] = useState<boolean>(false);
  const [jobs, setJobs] = useState<JobKind[]>([]);
  const watchedResources = useMemo(
    () => ({
      jobs: {
        isList: true,
        kind: 'Job',
        namespace,
      },
    }),
    [namespace],
  );
  const resources = useK8sWatchResources(watchedResources);

  const errorKey = Object.keys(resources).find((key) => resources[key].loadError);
  const loadError: string = errorKey ? resources[errorKey].loadError : '';

  // Derive the jobs list when the watched resources change and are fully
  // loaded; `loaded` and `jobs` keep their last value while the resources
  // are reloading.
  const [prevUid, setPrevUid] = useState<string | null>(null);
  const [prevResources, setPrevResources] = useState<typeof resources | null>(null);
  if (prevUid !== uid || prevResources !== resources) {
    setPrevUid(uid);
    setPrevResources(resources);
    if (
      !loadError &&
      Object.keys(resources).length > 0 &&
      Object.keys(resources).every((key) => resources[key].loaded)
    ) {
      setJobs(getJobsForCronJob(uid, resources));
      setLoaded(true);
    }
  }

  return { loaded, loadError, jobs };
};
