import * as React from 'react';
import { UserKind, referenceForModel, k8sList } from '@console/internal/module/k8s';
import {
  WatchK8sResource,
  useK8sWatchResource,
  WatchK8sResult,
} from '@console/internal/components/utils/k8s-watch-hook';
import {
  CLOUD_SHELL_LABEL,
  CLOUD_SHELL_CREATOR_LABEL,
  CloudShellResource,
  CLOUD_SHELL_IMMUTABLE_ANNOTATION,
  startWorkspace,
} from './cloud-shell-utils';
import { useAccessReview2 } from '@console/internal/components/utils';
import { ProjectModel } from '@console/internal/models';
import { useSafetyFirst } from '@console/internal/components/safety-first';
import { WorkspaceModel } from '../../models';

const findWorkspace = (data?: CloudShellResource[]): CloudShellResource | undefined => {
  if (Array.isArray(data)) {
    return data.find(
      (d) =>
        d?.metadata?.annotations?.[CLOUD_SHELL_IMMUTABLE_ANNOTATION] === 'true' &&
        !d?.metadata?.deletionTimestamp,
    );
  }
  return undefined;
};

const useCloudShellWorkspace = (
  user: UserKind,
  defaultNamespace?: string,
): WatchK8sResult<CloudShellResource> => {
  const [namespace, setNamespace] = useSafetyFirst(defaultNamespace);
  const [searching, setSearching] = useSafetyFirst<boolean>(false);
  const [noNamespaceFound, setNoNamespaceFound] = useSafetyFirst<boolean>(false);

  // sync defaultNamespace to namespace
  React.useEffect(() => {
    setNamespace(defaultNamespace);
    // a new namespace means we can start a new search
    setNoNamespaceFound(false);
  }, [defaultNamespace, setNamespace, setNoNamespaceFound]);

  const [canListWorkspaces, loadingAccessReview] = useAccessReview2({
    group: WorkspaceModel.apiGroup,
    resource: WorkspaceModel.plural,
    verb: 'list',
  });

  const uid = user?.metadata?.uid;
  const username = user?.metadata?.name;
  const isKubeAdmin = !uid && username === 'kube:admin';
  const resource = React.useMemo<WatchK8sResource>(() => {
    if (loadingAccessReview || (!canListWorkspaces && !namespace)) {
      return undefined;
    }
    const result: WatchK8sResource = {
      kind: referenceForModel(WorkspaceModel),
      isList: true,
      selector: {
        matchLabels: {
          [CLOUD_SHELL_LABEL]: 'true',
          [CLOUD_SHELL_CREATOR_LABEL]: isKubeAdmin ? '' : uid,
        },
      },
    };

    if (!canListWorkspaces) {
      result.namespace = namespace;
    }
    return result;
  }, [isKubeAdmin, uid, namespace, loadingAccessReview, canListWorkspaces]);

  // call k8s api to fetch workspace
  const [data, loaded, loadError] = useK8sWatchResource<CloudShellResource[]>(resource);
  const workspace = findWorkspace(data);

  const searchNamespaces =
    // wait for access review to return
    !loadingAccessReview &&
    // user cannot list workspaces at the cluster scope
    !canListWorkspaces &&
    // fetching the workspace succeeded or failed
    (loaded || loadError) &&
    // was a workspace was found
    !workspace &&
    // did a previous search result in no namespace found
    !noNamespaceFound &&
    // are we currently searching
    !searching;

  // FIXME need to use a service account on the backend to find the workspace instead of inefficiently looping through namespaces
  React.useEffect(() => {
    let unmounted = false;
    if (searchNamespaces) {
      (async () => {
        setNoNamespaceFound(false);
        setSearching(true);
        setNamespace(undefined);
        try {
          const projects = await k8sList(ProjectModel);
          if (unmounted) return;
          if (Array.isArray(projects)) {
            for (const project of projects) {
              const projectName = project.metadata.name;
              try {
                // search each project sequentially
                // eslint-disable-next-line no-await-in-loop
                const workspaceList = await k8sList(WorkspaceModel, {
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
  }, [isKubeAdmin, searchNamespaces, setNamespace, uid, setNoNamespaceFound, setSearching]);

  React.useEffect(() => {
    if (workspace?.spec && !workspace.spec.started) {
      startWorkspace(workspace);
    }
    // Run this effect if the workspace name or namespace changes.
    // This effect should only be run once per workspace.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace?.metadata?.name, workspace?.metadata?.namespace]);

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
