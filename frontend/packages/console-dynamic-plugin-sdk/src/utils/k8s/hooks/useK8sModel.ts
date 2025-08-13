import { useSelector } from 'react-redux';
import { K8sModel } from '../../../api/common-types';
import { SDKStoreState } from '../../../app/redux-types';
import {
  UseK8sModel,
  K8sResourceKindReference,
  K8sGroupVersionKind,
} from '../../../extensions/console-types';
import { getGroupVersionKindForReference, transformGroupVersionKindToReference } from '../k8s-ref';

export const getK8sModel = (
  k8s,
  k8sGroupVersionKind?: K8sResourceKindReference | K8sGroupVersionKind,
): K8sModel => {
  const kindReference = transformGroupVersionKindToReference(k8sGroupVersionKind);
  return kindReference
    ? k8s.getIn(['RESOURCES', 'models', kindReference]) ??
        k8s.getIn(['RESOURCES', 'models', getGroupVersionKindForReference(kindReference).kind])
    : undefined;
};

/**
 * Hook that retrieves the Kubernetes model definition for a specific resource type.
 *
 * K8s models contain essential metadata about resource types including API paths,
 * namespacing behavior, and display properties. This hook is fundamental for any
 * component that needs to interact with Kubernetes resources.
 *
 * **Common use cases:**
 * - Validating if a resource type exists before making API calls
 * - Getting API group/version information for resource operations
 * - Determining if a resource is namespaced or cluster-scoped
 * - Building dynamic UIs that work with multiple resource types
 *
 * **Model discovery:**
 * - Models are loaded from API server discovery endpoints
 * - Custom Resource models are dynamically registered
 * - Static models for core Kubernetes resources are pre-loaded
 * - Plugin-defined models are automatically integrated
 *
 * **Performance considerations:**
 * - Models are cached in Redux store for efficient access
 * - Hook returns immediately with cached data when available
 * - Model loading is a one-time operation per resource type
 * - Uses selectors to minimize re-renders
 *
 * **Model properties:**
 * - `apiGroup`, `apiVersion`: API endpoint information
 * - `kind`, `plural`: Resource type identifiers
 * - `namespaced`: Boolean indicating namespace scoping
 * - `verbs`: Available operations (get, list, create, etc.)
 * - `crd`: Boolean indicating if this is a Custom Resource
 *
 * **Edge cases:**
 * - Returns undefined model for unknown resource types
 * - inFlight is true during initial API discovery
 * - Legacy string references are supported but deprecated
 * - Model may be undefined until discovery completes
 *
 * @example
 * ```tsx
 * // Basic model lookup for API operations
 * const ResourceActions: React.FC<{groupVersionKind: K8sGroupVersionKind}> = ({groupVersionKind}) => {
 *   const [model, inFlight] = useK8sModel(groupVersionKind);
 *
 *   if (inFlight) {
 *     return <Spinner size="sm" />;
 *   }
 *
 *   if (!model) {
 *     return <Alert variant="warning">Unknown resource type</Alert>;
 *   }
 *
 *   const canCreate = model.verbs?.includes('create');
 *   const isNamespaced = model.namespaced;
 *
 *   return (
 *     <div>
 *       <h3>{model.kind} ({model.apiVersion})</h3>
 *       <p>Namespaced: {isNamespaced ? 'Yes' : 'No'}</p>
 *       {canCreate && <Button>Create {model.kind}</Button>}
 *     </div>
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Building resource creation form
 * const CreateResourceForm: React.FC<{resourceType: string}> = ({resourceType}) => {
 *   const [model, inFlight] = useK8sModel({kind: resourceType, version: 'v1'});
 *   const [namespace] = useActiveNamespace();
 *
 *   if (!model && !inFlight) {
 *     return <Alert variant="danger">Resource type "{resourceType}" not found</Alert>;
 *   }
 *
 *   const showNamespaceField = model?.namespaced && namespace !== 'default';
 *
 *   return (
 *     <Form>
 *       <FormGroup label="Name" isRequired>
 *         <TextInput />
 *       </FormGroup>
 *       {showNamespaceField && (
 *         <FormGroup label="Namespace">
 *           <NamespaceDropdown />
 *         </FormGroup>
 *       )}
 *     </Form>
 *   );
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Custom Resource validation
 * const CustomResourceEditor: React.FC<{crd: CustomResourceDefinitionKind}> = ({crd}) => {
 *   const [model, inFlight] = useK8sModel({
 *     group: crd.spec.group,
 *     version: crd.spec.versions[0].name,
 *     kind: crd.spec.names.kind
 *   });
 *
 *   if (inFlight) {
 *     return <LoadingSkeleton />;
 *   }
 *
 *   if (!model) {
 *     return (
 *       <Alert variant="info">
 *         Custom Resource "{crd.spec.names.kind}" is not yet available.
 *         It may still be installing.
 *       </Alert>
 *     );
 *   }
 *
 *   return <ResourceEditor model={model} />;
 * };
 * ```
 *
 * @param groupVersionKind Resource type identifier. Preferred format is `K8sGroupVersionKind` object with `group`, `version`, and `kind` properties. Legacy string format `group~version~kind` is deprecated but supported
 * @returns Tuple containing:
 *   - `model`: K8sModel object with resource metadata, undefined if resource type unknown
 *   - `inFlight`: Boolean indicating if API discovery is in progress
 */
export const useK8sModel: UseK8sModel = (k8sGroupVersionKind) => [
  useSelector<SDKStoreState, K8sModel>(({ k8s }) => getK8sModel(k8s, k8sGroupVersionKind)),
  useSelector<SDKStoreState, boolean>(({ k8s }) => k8s.getIn(['RESOURCES', 'inFlight']) ?? false),
];
