import {
  AccessReviewResourceAttributes,
  K8sModel,
  K8sResourceKind,
  K8sVerb,
} from '@console/dynamic-plugin-sdk/src/lib-core';

/**
 * Function that provides access review attributes for a given resource and verb.
 * @param the verb to check access for
 * @param  resource the resoure to check access for
 * @param subresource the subresource to check access for
 * @returns The access review attributes for the given resource and verb
 */
export const getAccessReviewResourceAttributes = (
  verb: K8sVerb,
  model: K8sModel,
  resource: K8sResourceKind,
  subresource?: string,
): AccessReviewResourceAttributes =>
  model && resource
    ? {
        group: model.apiGroup,
        resource: model.plural,
        subresource,
        verb,
        name: resource.metadata.name,
        namespace: resource.metadata.namespace,
      }
    : null;
