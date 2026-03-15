import { useMemo } from 'react';
import type {
  K8sResourceCommon,
  K8sResourceKind,
  WatchK8sResource,
  WatchK8sResources,
  WatchK8sResult,
} from '@console/dynamic-plugin-sdk/src';
import { useFlag } from '@console/dynamic-plugin-sdk/src/utils/flags';
import {
  useK8sWatchResource,
  useK8sWatchResources,
} from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks';
import { ProjectModel } from '@console/internal/models';
import { FLAGS, getName } from '@console/shared/src';

export const useAccessibleResources = <R extends K8sResourceKind>(
  initResource?: WatchK8sResource,
): WatchK8sResult<R[]> => {
  const isAdmin = useFlag(FLAGS.CAN_LIST_NS);

  const [projectsData, projectsLoaded, projectsLoadError] = useK8sWatchResource<
    K8sResourceCommon[]
  >(
    !isAdmin && initResource
      ? {
          groupVersionKind: {
            group: ProjectModel.apiGroup,
            version: ProjectModel.apiVersion,
            kind: ProjectModel.kind,
          },
          isList: true,
        }
      : null,
  );

  const projectsNames = useMemo(
    () => (!isAdmin && projectsLoaded ? projectsData?.map(getName) : []),
    [isAdmin, projectsData, projectsLoaded],
  );

  const initResources: WatchK8sResources<any> = useMemo(() => {
    const resources = {};
    projectsNames.forEach((namespace) => {
      resources[namespace] = { ...initResource, namespace, namespaced: true };
    });
    return resources;
  }, [initResource, projectsNames]);

  const namespacedResources = useK8sWatchResources(initResources);

  const [resources, resourcesLoaded, resourcesLoadError] = useK8sWatchResource<R[]>(
    initResource && isAdmin ? initResource : undefined,
  );

  return useMemo(() => {
    if (isAdmin) {
      return [resources, resourcesLoaded, resourcesLoadError];
    }

    const namespacedResults = Object.values(namespacedResources);
    const loaded =
      projectsLoaded && namespacedResults.every((results) => results.loaded || results.loadError);

    if (!loaded) {
      return [[], false, undefined];
    }

    const loadError =
      projectsLoadError || namespacedResults.find((results) => results.loadError)?.loadError;

    const allResources = namespacedResults
      .filter((results) => !results.loadError)
      .map((results) => results.data ?? [])
      .flat();

    return [allResources, true, loadError];
  }, [
    isAdmin,
    namespacedResources,
    projectsLoadError,
    projectsLoaded,
    resources,
    resourcesLoadError,
    resourcesLoaded,
  ]);
};
