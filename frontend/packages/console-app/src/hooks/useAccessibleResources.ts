import { useMemo } from 'react';
import type {
  K8sResourceCommon,
  K8sResourceKind,
  WatchK8sResource,
  WatchK8sResources,
  WatchK8sResult,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { useFlag } from '@console/dynamic-plugin-sdk/src/utils/flags';
import {
  useK8sWatchResource,
  useK8sWatchResources,
} from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks';
import { ProjectModel } from '@console/internal/models';
import { FLAGS } from '@console/shared/src/constants/common';
import { getName } from '@console/shared/src/selectors/common';

/**
 * Loads a Kubernetes resource from every namespace the current user can access.
 *
 * Any error loading the projects list or any namespaced resource watch is surfaced in the third
 * tuple element. When multiple loads fail, only the first load error found is returned: the
 * projects list error takes precedence, otherwise the first namespaced watch error.
 *
 * @returns [resources, loaded, loadError]
 */
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
    () => (!isAdmin && projectsLoaded && projectsData ? projectsData.map(getName) : []),
    [isAdmin, projectsData, projectsLoaded],
  );

  const initResources = useMemo((): WatchK8sResources<Record<string, R>> => {
    if (!initResource) {
      return {};
    }

    return projectsNames.reduce<WatchK8sResources<Record<string, R>>>((resources, namespace) => {
      resources[namespace] = { ...initResource, namespace, namespaced: true };
      return resources;
    }, {});
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
      projectsLoadError ||
      (namespacedResults.length && namespacedResults.every((results) => results.loadError)
        ? namespacedResults[0].loadError
        : null);

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
