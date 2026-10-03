import type { K8sResourceCommon } from '@console/internal/module/k8s';
import { referenceFor } from '@console/internal/module/k8s';

/** Returns a resource reference only for a complete Kubernetes list item. */
export const getResourceReference = (item: unknown): string | undefined => {
  if (!item || typeof item !== 'object') return undefined;
  const resource = item as K8sResourceCommon;
  if (
    typeof resource.apiVersion !== 'string' ||
    typeof resource.kind !== 'string' ||
    typeof resource.metadata?.name !== 'string'
  ) {
    return undefined;
  }
  return referenceFor(resource) || undefined;
};

/** Bulk providers only receive selections of one Kubernetes model. */
export const getSelectedResources = (
  items: unknown[],
): { reference: string; resources: K8sResourceCommon[] } | undefined => {
  if (!items.length) return undefined;
  const reference = getResourceReference(items[0]);
  if (!reference || items.some((item) => getResourceReference(item) !== reference))
    return undefined;
  return { reference, resources: items as K8sResourceCommon[] };
};
