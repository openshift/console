import { makeQuery, makeReduxID } from '@console/internal/components/utils';
import { FirehoseResourceEnhanced } from '../../types/custom';

export type IDReference = string[];

export type IDReferences = { [key: string]: IDReference };

export const makeIDReferences = (resources: FirehoseResourceEnhanced[]): IDReferences => {
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
