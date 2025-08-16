import * as React from 'react';
import { Map as ImmutableMap, Iterable as ImmutableIterable } from 'immutable';
import { useSelector, useDispatch } from 'react-redux';
import { createSelectorCreator, defaultMemoize } from 'reselect';
import { K8sModel } from '../../../api/common-types';
import * as k8sActions from '../../../app/k8s/actions/k8s';
import { UseK8sWatchResources } from '../../../extensions/console-types';
import {
  transformGroupVersionKindToReference,
  getReferenceForModel,
  getGroupVersionKindForReference,
} from '../k8s-ref';
import { GetIDAndDispatch, OpenShiftReduxRootState } from './k8s-watch-types';
import { getIDAndDispatch, getReduxData, NoModelError } from './k8s-watcher';
import { useDeepCompareMemoize } from './useDeepCompareMemoize';
import { getK8sModel } from './useK8sModel';
import { useModelsLoaded } from './useModelsLoaded';
import { usePrevious } from './usePrevious';

/**
 * Hook that retrieves multiple Kubernetes resources simultaneously with live updates and loading states.
 *
 * This hook is essential for building complex UIs that need to watch multiple related resources
 * at once, such as dashboards, list pages, and relationship views.
 *
 * **Common use cases:**
 * - Dashboard pages showing multiple resource types (Pods, Services, Deployments)
 * - Resource relationship views (Deployment + ReplicaSets + Pods)
 * - List pages with related resources (Pods with their owning controllers)
 * - Overview pages displaying cluster-wide resource counts
 *
 * **Performance benefits:**
 * - Efficiently manages multiple WebSocket connections
 * - Deduplicates identical resource watches across components
 * - Uses optimized Redux selectors to minimize re-renders
 * - Batches updates for related resource changes
 *
 * **Watch behavior:**
 * - All resources are watched independently with their own lifecycle
 * - Each resource has its own loading and error states
 * - Resources can be added/removed dynamically by changing the input object
 * - Automatically handles model loading and validation
 *
 * **Memory management:**
 * - Cleans up all WebSocket connections when component unmounts
 * - Automatically stops watching resources removed from input
 * - Uses immutable data structures for efficient change detection
 *
 * **Error handling:**
 * - Each resource has independent error handling
 * - Missing models result in NoModelError for specific resources
 * - Network errors don't affect other resource watches
 * - Gracefully handles permission errors per resource
 *
 * **Edge cases:**
 * - Empty input object returns empty results immediately
 * - Invalid resource definitions are skipped with appropriate errors
 * - Handles mixed namespaced and cluster-scoped resources
 * - Supports dynamic resource lists that change over time
 *
 * @example
 * ```tsx
 * // Dashboard showing multiple resource types
 * const ClusterOverview: React.FC = () => {
 *   const watchResources = {
 *     pods: {
 *       kind: 'Pod',
 *       isList: true,
 *       namespace: 'default'
 *     },
 *     services: {
 *       kind: 'Service',
 *       isList: true,
 *       namespace: 'default'
 *     },
 *     deployments: {
 *       groupVersionKind: {group: 'apps', version: 'v1', kind: 'Deployment'},
 *       isList: true,
 *       namespace: 'default'
 *     }
 *   };
 *
 *   const {pods, services, deployments} = useK8sWatchResources(watchResources);
 *
 *   const allLoaded = pods.loaded && services.loaded && deployments.loaded;
 *   const hasErrors = pods.loadError || services.loadError || deployments.loadError;
 *
 *   if (hasErrors) {
 *     return <ErrorAlert errors={[pods.loadError, services.loadError, deployments.loadError]} />;
 *   }
 *
 *   if (!allLoaded) {
 *     return <DashboardSkeleton />;
 *   }
 *
 *   return (
 *     <div className="cluster-overview">
 *       <ResourceCard title="Pods" count={pods.data.length} resources={pods.data} />
 *       <ResourceCard title="Services" count={services.data.length} resources={services.data} />
 *       <ResourceCard title="Deployments" count={deployments.data.length} resources={deployments.data} />
 *     </div>
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Resource relationships - Deployment with its Pods
 * const DeploymentDetails: React.FC<{deployment: DeploymentKind}> = ({deployment}) => {
 *   const watchResources = {
 *     replicaSets: {
 *       kind: 'ReplicaSet',
 *       isList: true,
 *       namespace: deployment.metadata.namespace,
 *       selector: deployment.spec.selector
 *     },
 *     pods: {
 *       kind: 'Pod',
 *       isList: true,
 *       namespace: deployment.metadata.namespace,
 *       selector: deployment.spec.selector
 *     }
 *   };
 *
 *   const {replicaSets, pods} = useK8sWatchResources(watchResources);
 *
 *   return (
 *     <>
 *       <DeploymentOverview deployment={deployment} />
 *       <ReplicaSetsList
 *         replicaSets={replicaSets.data}
 *         loaded={replicaSets.loaded}
 *         error={replicaSets.loadError}
 *       />
 *       <PodsList
 *         pods={pods.data}
 *         loaded={pods.loaded}
 *         error={pods.loadError}
 *       />
 *     </>
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Dynamic resource watching based on user selection
 * const ResourceExplorer: React.FC<{selectedNamespaces: string[]}> = ({selectedNamespaces}) => {
 *   const watchResources = React.useMemo(() => {
 *     const resources = {};
 *     selectedNamespaces.forEach(ns => {
 *       resources[`pods-${ns}`] = {
 *         kind: 'Pod',
 *         isList: true,
 *         namespace: ns
 *       };
 *       resources[`services-${ns}`] = {
 *         kind: 'Service',
 *         isList: true,
 *         namespace: ns
 *       };
 *     });
 *     return resources;
 *   }, [selectedNamespaces]);
 *
 *   const results = useK8sWatchResources(watchResources);
 *
 *   return (
 *     <div>
 *       {selectedNamespaces.map(ns => (
 *         <NamespaceCard
 *           key={ns}
 *           namespace={ns}
 *           pods={results[`pods-${ns}`]}
 *           services={results[`services-${ns}`]}
 *         />
 *       ))}
 *     </div>
 *   );
 * };
 * ```
 *
 * @param initResources Object where keys are unique identifiers and values are watch resource configurations. Each value contains:
 *   - `groupVersionKind` or `kind`: Resource type identifier
 *   - `isList`: Boolean indicating if watching a list or single resource
 *   - `namespace`: Namespace for namespaced resources (omit for cluster-scoped)
 *   - `name`: Specific resource name (for single resource watches)
 *   - `selector`: Label selector for filtering list results
 * @returns Object with same keys as input, where each value contains:
 *   - `data`: The Kubernetes resource(s), empty array/object during loading
 *   - `loaded`: Boolean indicating if initial load completed for this resource
 *   - `loadError`: Error object if this specific resource watch failed, undefined if successful
 */
export const useK8sWatchResources: UseK8sWatchResources = (initResources) => {
  const resources = useDeepCompareMemoize(initResources, true);
  const modelsLoaded = useModelsLoaded();

  const allK8sModels = useSelector<OpenShiftReduxRootState, ImmutableMap<string, K8sModel>>(
    (state: OpenShiftReduxRootState) => state.k8s.getIn(['RESOURCES', 'models']),
  );

  const prevK8sModels = usePrevious(allK8sModels);
  const prevResources = usePrevious(resources);

  const k8sModelsRef = React.useRef<ImmutableIterable<string, K8sModel>>(ImmutableMap());

  if (
    prevResources !== resources ||
    (prevK8sModels !== allK8sModels &&
      Object.values(resources).some((r) => {
        const modelReference = transformGroupVersionKindToReference(r.groupVersionKind || r.kind);
        return (
          getK8sModel(prevK8sModels, modelReference) !== getK8sModel(allK8sModels, modelReference)
        );
      }))
  ) {
    const requiredModels = Object.values(resources).map((r) =>
      transformGroupVersionKindToReference(r.groupVersionKind || r.kind),
    );
    k8sModelsRef.current = allK8sModels.filter(
      (model) =>
        requiredModels.includes(getReferenceForModel(model)) || requiredModels.includes(model.kind),
    );
  }

  const k8sModels = k8sModelsRef.current;

  const reduxIDs = React.useMemo<{
    [key: string]: ReturnType<GetIDAndDispatch<OpenShiftReduxRootState>> & { noModel: boolean };
  }>(
    () =>
      modelsLoaded
        ? Object.keys(resources).reduce((ids, key) => {
            const modelReference = transformGroupVersionKindToReference(
              resources[key].groupVersionKind || resources[key].kind,
            );

            const resourceModel =
              modelReference &&
              (k8sModels.get(modelReference) ||
                k8sModels.get(getGroupVersionKindForReference(modelReference).kind));
            if (!resourceModel) {
              ids[key] = {
                noModel: true,
              };
            } else {
              const idAndDispatch = getIDAndDispatch(resources[key], resourceModel);
              if (idAndDispatch) {
                ids[key] = idAndDispatch;
              }
            }
            return ids;
          }, {})
        : null,
    [k8sModels, modelsLoaded, resources],
  );

  const dispatch = useDispatch();
  React.useEffect(() => {
    const reduxIDKeys = Object.keys(reduxIDs || {});
    reduxIDKeys.forEach((k) => {
      if (reduxIDs[k].dispatch) {
        dispatch(reduxIDs[k].dispatch);
      }
    });
    return () => {
      reduxIDKeys.forEach((k) => {
        if (reduxIDs[k].dispatch) {
          dispatch(k8sActions.stopK8sWatch(reduxIDs[k].id));
        }
      });
    };
  }, [dispatch, reduxIDs]);

  const resourceK8sSelectorCreator = React.useMemo(
    () =>
      createSelectorCreator(
        // specifying createSelectorCreator<ImmutableMap<string, K8sKind>> throws type error
        defaultMemoize as any,
        (oldK8s: ImmutableMap<string, K8sModel>, newK8s: ImmutableMap<string, K8sModel>) =>
          Object.keys(reduxIDs || {})
            .filter((k) => !reduxIDs[k].noModel)
            .every((k) => oldK8s.get(reduxIDs[k].id) === newK8s.get(reduxIDs[k].id)),
      ),
    [reduxIDs],
  );

  const resourceK8sSelector = React.useMemo(
    () =>
      resourceK8sSelectorCreator(
        (state: OpenShiftReduxRootState) => state.k8s,
        (k8s) => k8s,
      ),
    [resourceK8sSelectorCreator],
  );

  const resourceK8s = useSelector(resourceK8sSelector);

  const results = React.useMemo(
    () =>
      Object.keys(resources).reduce((acc, key) => {
        if (reduxIDs?.[key].noModel) {
          acc[key] = {
            data: resources[key].isList ? [] : {},
            loaded: true,
            loadError: new NoModelError(),
          };
        } else if (resourceK8s.has(reduxIDs?.[key].id)) {
          const data = getReduxData(resourceK8s.getIn([reduxIDs[key].id, 'data']), resources[key]);
          const loaded = resourceK8s.getIn([reduxIDs[key].id, 'loaded']);
          const loadError = resourceK8s.getIn([reduxIDs[key].id, 'loadError']);
          acc[key] = { data, loaded, loadError };
        } else {
          acc[key] = {
            data: resources[key].isList ? [] : {},
            loaded: false,
            loadError: undefined,
          };
        }
        return acc;
      }, {} as any),
    [resources, reduxIDs, resourceK8s],
  );
  return results;
};
