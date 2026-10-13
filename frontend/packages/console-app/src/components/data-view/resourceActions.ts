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

/** Returns one reference for selectable items of a single Kubernetes resource kind. */
export const getResourceReferenceForItems = <TData>(
  items: TData[],
  isSelectable?: (item: TData) => boolean,
): string | undefined => {
  let firstResource: K8sResourceCommon | undefined;
  let reference: string | undefined;

  for (const item of items) {
    if (!isSelectable || isSelectable(item)) {
      if (!item || typeof item !== 'object') return undefined;

      const resource = item as K8sResourceCommon;
      if (
        typeof resource.apiVersion !== 'string' ||
        typeof resource.kind !== 'string' ||
        typeof resource.metadata?.name !== 'string'
      ) {
        return undefined;
      }

      if (!firstResource) {
        firstResource = resource;
        reference = getResourceReference(resource);
        if (!reference) return undefined;
      } else if (
        resource.apiVersion !== firstResource.apiVersion ||
        resource.kind !== firstResource.kind
      ) {
        return undefined;
      }
    }
  }

  return reference;
};

/** Bulk providers only receive selections of one Kubernetes model. */
export const getSelectedResources = (
  items: unknown[],
): { reference: string; resources: K8sResourceCommon[] } | undefined => {
  if (!items.length) return undefined;
  const reference = getResourceReferenceForItems(items);
  if (!reference) return undefined;
  return { reference, resources: items as K8sResourceCommon[] };
};
