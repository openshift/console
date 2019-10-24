import { FirehoseResource, makeQuery, makeReduxID } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';

type EnhancedFirehoseResource = FirehoseResource & { model: K8sResourceKind; fieldSelector: any };

export type IDReference = string[];

export type IDReferences = { [key: string]: IDReference };

export const makeIDReferences = (resources: EnhancedFirehoseResource[]): IDReferences => {
  return resources.reduce((acc, resource) => {
    const query = makeQuery(
      resource.namespace,
      resource.selector,
      resource.fieldSelector,
      resource.name,
    );
    acc[resource.prop] = ['k8s', makeReduxID(resource.model, query)];

    return acc;
  }, {});
};
