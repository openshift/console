import * as React from 'react';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind, JobKind } from '@console/internal/module/k8s';
import { getJobsForCronJob } from '../utils';

export const useJobsForCronJobWatcher = (
  cronJob: K8sResourceKind,
): { loaded: boolean; loadError: string; jobs: JobKind[] } => {
  const { namespace, uid } = cronJob.metadata;
  const [loaded, setLoaded] = React.useState<boolean>(false);
  const [loadError, setLoadError] = React.useState<string>('');
  const [jobs, setJobs] = React.useState<JobKind[]>([]);
  const watchedResources = React.useMemo(
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

  React.useEffect(() => {
    const errorKey = Object.keys(resources).find((key) => resources[key].loadError);
    if (errorKey) {
      setLoadError(resources[errorKey].loadError);
      return;
    }
    setLoadError('');
    if (
      Object.keys(resources).length > 0 &&
      Object.keys(resources).every((key) => resources[key].loaded)
    ) {
      const resourceJobs = getJobsForCronJob(uid, resources);
      setJobs(resourceJobs);
      setLoaded(true);
    }
  }, [uid, resources]);

  return { loaded, loadError, jobs };
};
