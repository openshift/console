import * as _ from 'lodash-es';

// eslint-disable-next-line no-unused-vars
import { K8sResourceKind } from '../../module/k8s';
import { modelFor, referenceForOwnerRef } from '../../module/k8s/k8s-models';

export const breadcrumbsForOwnerRefs = (obj: K8sResourceKind) => {
  const ownerRefs = _.get(obj, 'metadata.ownerReferences');
  return _.map(ownerRefs, ref => ({
    name: ref.name,
    path: `/k8s/ns/${obj.metadata.namespace}/${modelFor(referenceForOwnerRef(ref)).plural}/${ref.name}`,
  }));
};
