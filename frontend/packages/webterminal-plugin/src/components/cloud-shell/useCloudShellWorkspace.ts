import * as React from 'react';
import { WatchK8sResource, WatchK8sResult, useSafetyFirst } from '@console/dynamic-plugin-sdk';
import { useAccessReview2 } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ProjectModel } from '@console/internal/models';
import { UserInfo, referenceForModel, k8sList, K8sKind } from '@console/internal/module/k8s'; // TODO: is this import correct?
import {
  CLOUD_SHELL_LABEL,
  CLOUD_SHELL_CREATOR_LABEL,
  CloudShellResource,
  CLOUD_SHELL_RESTRICTED_ANNOTATION,
  CLOUD_SHELL_PROTECTED_NAMESPACE,
} from './cloud-shell-utils';

const findWorkspace = (data?: CloudShellResource[]): CloudShellResource | undefined => {
  if (Array.isArray(data)) {
    return data.find(
      (d) =>
        d?.metadata?.annotations?.[CLOUD_SHELL_RESTRICTED_ANNOTATION] === 'true' &&
        !d?.metadata?.deletionTimestamp,
    );
  }
  return undefined;
};

const useCloudShellWorkspace = (
  user: UserInfo,
  isClusterAdmin: boolean,
  workspaceModel: K8sKind,
  defaultNamespace: string = null,
): WatchK8sResult<CloudShellResource> => {
  const [namespace, setNamespace] = useSafetyFirst(defaultNamespace);
  const [searching, setSearching] = useSafetyFirst<boolean>(false);
  const [noNamespaceFound, setNoNamespaceFound] = useSafetyFirst<boolean>(false);

  // sync defaultNamespace to namespace
  React.useEffect(() => {
    setNamespace(defaultNamespace);
    // a new namespace means we can start a new search
    defaultNamespace && setNoNamespaceFound(false);
  }, [defaultNamespace, setNamespace, setNoNamespaceFound]);

  const [canListWorkspaces, loadingAccessReview] = useAccessReview2({
    group: workspaceModel.apiGroup,
    resource: workspaceModel.plural,
    verb: 'list',
  });

  const uid = user?.uid;
  const username = user?.username;
  const isKubeAdmin = !uid && username === 'kube:admin';
  const resource = React.useMemo<WatchK8sResource>(() => {
    if (loadingAccessReview || (!canListWorkspaces && !namespace)) {
      return undefined;
    }
    const result: WatchK8sResource = {
      kind: referenceForModel(workspaceModel),
      isList: true,
      selector: {
        matchLabels: {
          [CLOUD_SHELL_LABEL]: 'true',
          [CLOUD_SHELL_CREATOR_LABEL]: isKubeAdmin ? '' : uid,
        },
      },
    };

    if (isClusterAdmin) {
      result.namespace = CLOUD_SHELL_PROTECTED_NAMESPACE;
    } else if (!canListWorkspaces) {
      result.namespace = namespace;
    }

    return result;
  }, [
    loadingAccessReview,
    canListWorkspaces,
    namespace,
    isKubeAdmin,
    uid,
    isClusterAdmin,
    workspaceModel,
  ]);

  // call k8s api to fetch workspace
  const [data, loaded, loadError] = useK8sWatchResource<CloudShellResource[]>(resource);
  const workspace = findWorkspace(data);

  const searchNamespaces =
    // are we currently searching
    searching ||
    // wait for access review to return
    (!loadingAccessReview &&
      // user cannot list workspaces at the cluster scope
      !canListWorkspaces &&
      // fetching the workspace succeeded or failed
      (loaded || loadError) &&
      // was a workspace was found
      !workspace &&
      // did a previous search result in no namespace found
      !noNamespaceFound);

  // FIXME need to use a service account on the backend to find the workspace instead of inefficiently looping through namespaces
  React.useEffect(() => {
    let unmounted = false;
    if (searchNamespaces) {
      (async () => {
        setNoNamespaceFound(false);
        setSearching(true);
        try {
          const projects = await k8sList(ProjectModel);
          if (unmounted) return;
          if (Array.isArray(projects)) {
            for (const project of projects) {
              const projectName = project.metadata.name;
              try {
                // search each project sequentially
                // eslint-disable-next-line no-await-in-loop
                const workspaceList = await k8sList(workspaceModel, {
                  ns: projectName,
                  labelSelector: {
                    matchLabels: {
                      [CLOUD_SHELL_LABEL]: 'true',
                      [CLOUD_SHELL_CREATOR_LABEL]: isKubeAdmin ? '' : uid,
                    },
                  },
                });
                if (unmounted) return;
                const foundWorkspace = findWorkspace(workspaceList);
                if (foundWorkspace) {
                  setNamespace(projectName);
                  return;
                }
              } catch {
                // ignore and move on to the next namespace
              }
            }
          }
          setNoNamespaceFound(true);
        } catch (e) {
          setNoNamespaceFound(true);
        } finally {
          setSearching(false);
        }
      })();
    }
    return () => {
      unmounted = true;
    };
  }, [
    isKubeAdmin,
    searchNamespaces,
    setNamespace,
    uid,
    setNoNamespaceFound,
    setSearching,
    workspaceModel,
  ]);

  return [
    workspace,
    // loaded if we have a resource loaded and currently not searching
    // or if the search resulted in no namespace found
    (!!resource && !searching && !searchNamespaces && loaded) || noNamespaceFound,
    // provide the error associated with fetching the workspace
    resource && !searching && !searchNamespaces ? loadError : undefined,
  ];
};

export default useCloudShellWorkspace;
