import * as _ from 'lodash-es';

// eslint-disable-next-line no-unused-vars
import { modelFor, referenceForOwnerRef, K8sResourceKind } from '../../module/k8s';

export const breadcrumbsForOwnerRefs = (obj: K8sResourceKind) => {
  const ownerRefs = _.get(obj, 'metadata.ownerReferences');
  return _.compact(_.map(ownerRefs, ref => {
    const model = modelFor(referenceForOwnerRef(ref));
    // ownerReferences might reference resources we don't know about (or even
    // ones that don't exist since it's not blocked by the API). Avoid runtime
    // errors if we don't have a model for this reference.
    if (!model) {
      return null;
    }

    return {
      name: ref.name,
      path: `/k8s/ns/${obj.metadata.namespace}/${model.plural}/${ref.name}`,
    };
  }));
};
