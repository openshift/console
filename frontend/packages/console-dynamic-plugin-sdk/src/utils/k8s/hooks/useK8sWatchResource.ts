import * as React from 'react';
import { Map as ImmutableMap } from 'immutable';
import { useSelector, useDispatch } from 'react-redux';
import * as k8sActions from '../../../app/k8s/actions/k8s';
import { getReduxIdPayload } from '../../../app/k8s/reducers/k8sSelector';
import { SDKStoreState } from '../../../app/redux-types';
import { UseK8sWatchResource } from '../../../extensions/console-types';
import { getIDAndDispatch, getReduxData, NoModelError } from './k8s-watcher';
import { useDeepCompareMemoize } from './useDeepCompareMemoize';
import { useK8sModel } from './useK8sModel';
import { useModelsLoaded } from './useModelsLoaded';

/**
 * Hook that retrieves a single Kubernetes resource with live updates and loading states.
 *
 * This is one of the most important hooks for plugin developers, providing real-time access
 * to Kubernetes resources with automatic updates, error handling, and loading states.
 *
 * **Common use cases:**
 * - Watching a specific resource instance (Pod, Deployment, ConfigMap, etc.)
 * - Building resource detail pages that stay in sync with cluster state
 * - Implementing forms that need current resource data
 *
 * **Watch behavior:**
 * - Establishes WebSocket connection to Kubernetes API server
 * - Automatically reconnects on connection failures
 * - Provides live updates when resource changes in cluster
 * - Manages resource lifecycle (creation, updates, deletion)
 *
 * **Performance considerations:**
 * - Uses Redux for efficient state management and caching
 * - Automatically deduplicates identical watch requests
 * - Cleans up WebSocket connections when component unmounts
 * - Deep compares watch parameters to prevent unnecessary re-subscriptions
 *
 * **Error handling:**
 * - Returns loading state during initial fetch
 * - Provides detailed error objects for network/permission issues
 * - Handles 404 errors for deleted resources gracefully
 * - Supports retry logic for transient failures
 *
 * **Edge cases:**
 * - Returns empty object/array during initial load
 * - Handles undefined resource parameter gracefully
 * - Manages permission errors (403/401) appropriately
 * - Supports both namespaced and cluster-scoped resources
 *
 * @example
 * ```tsx
 * // Watch a specific Pod
 * const PodDetails: React.FC<{podName: string, namespace: string}> = ({podName, namespace}) => {
 *   const [pod, loaded, error] = useK8sWatchResource({
 *     groupVersionKind: {kind: 'Pod', version: 'v1'},
 *     name: podName,
 *     namespace,
 *   });
 *
 *   if (error) {
 *     return <Alert variant="danger">Failed to load pod: {error.message}</Alert>;
 *   }
 *
 *   if (!loaded) {
 *     return <Skeleton />;
 *   }
 *
 *   return (
 *     <div>
 *       <h1>{pod.metadata.name}</h1>
 *       <p>Status: {pod.status.phase}</p>
 *       <p>Node: {pod.spec.nodeName}</p>
 *     </div>
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Watch a CustomResourceDefinition
 * const CustomResourceDetails: React.FC<{name: string}> = ({name}) => {
 *   const [resource, loaded, error] = useK8sWatchResource({
 *     groupVersionKind: {
 *       group: 'example.com',
 *       version: 'v1',
 *       kind: 'MyCustomResource'
 *     },
 *     name,
 *     namespace: 'default'
 *   });
 *
 *   return loaded ? (
 *     <ResourceDetailsCard resource={resource} />
 *   ) : (
 *     <LoadingSpinner />
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Conditional watching based on props
 * const ConditionalResourceWatcher: React.FC<{shouldWatch: boolean, resourceName: string}> = ({shouldWatch, resourceName}) => {
 *   const [resource, loaded, error] = useK8sWatchResource(
 *     shouldWatch ? {
 *       kind: 'ConfigMap',
 *       name: resourceName,
 *       namespace: 'kube-system'
 *     } : null
 *   );
 *
 *   if (!shouldWatch) {
 *     return <div>Resource watching disabled</div>;
 *   }
 *
 *   return loaded && resource ? (
 *     <ConfigMapEditor configMap={resource} />
 *   ) : (
 *     <Spinner />
 *   );
 * };
 * ```
 *
 * @param initResource Watch resource configuration object or null/undefined to disable watching. Contains:
 *   - `groupVersionKind` or `kind`: Resource type identifier
 *   - `name`: Specific resource name to watch
 *   - `namespace`: Namespace for namespaced resources (omit for cluster-scoped)
 *   - `isList`: Should be false/undefined for single resource watching
 * @returns Tuple containing:
 *   - `resource`: The Kubernetes resource object, empty object during loading, undefined if watching disabled
 *   - `loaded`: Boolean indicating if initial load completed (true when data available or error occurred)
 *   - `error`: Error object if watch failed, undefined if successful or still loading
 */
export const useK8sWatchResource: UseK8sWatchResource = (initResource) => {
  const resource = useDeepCompareMemoize(initResource, true);
  const modelsLoaded = useModelsLoaded();

  const [k8sModel] = useK8sModel(resource?.groupVersionKind || resource?.kind);

  const reduxID = React.useMemo(() => getIDAndDispatch(resource, k8sModel), [k8sModel, resource]);

  const dispatch = useDispatch();

  React.useEffect(() => {
    if (reduxID) {
      dispatch(reduxID.dispatch);
    }
    return () => {
      if (reduxID) {
        dispatch(k8sActions.stopK8sWatch(reduxID.id));
      }
    };
  }, [dispatch, reduxID]);

  const resourceK8s = useSelector<SDKStoreState, ImmutableMap<string, any>>((state) =>
    reduxID ? getReduxIdPayload(state, reduxID.id) : null,
  );

  return React.useMemo(() => {
    if (!resource) {
      return [undefined, true, undefined];
    }
    if (!resourceK8s) {
      const data = resource?.isList ? [] : {};
      return modelsLoaded && !k8sModel
        ? [data, true, new NoModelError()]
        : [data, false, undefined];
    }

    const data = getReduxData(resourceK8s.get('data'), resource);
    const loaded = resourceK8s.get('loaded');
    const loadError = resourceK8s.get('loadError');
    return [data, loaded, loadError];
  }, [resource, resourceK8s, modelsLoaded, k8sModel]);
};
