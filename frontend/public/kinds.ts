/* eslint-disable no-unused-vars */
import * as _ from 'lodash-es';
import { connect } from 'react-redux';
import { Map as ImmutableMap, fromJS } from 'immutable';
import { match } from 'react-router-dom';

import { CustomResourceDefinitionKind, K8sKind, K8sResourceKindReference, referenceForCRD } from './module/k8s';
import { allModels, kindForReference, referenceForModel } from './module/k8s/k8s-models';
import { coFetchJSON } from './co-fetch';
import { namespacedResources } from './ui/ui-actions';
/* eslint-enable no-unused-vars */

export const kindReducerName = 'KINDS';
export const inFlight = 'inFlight';

export const kindReducer = (state: ImmutableMap<"kinds" | "inFlight", any>, action) => {
  if (!state) {
    return fromJS({kinds: allModels(), inFlight: false});
  }

  switch (action.type) {
    case 'getCRDsinflight':
      return state.set(inFlight, true);

    case 'addCRDs':
      return (action.kinds as CustomResourceDefinitionKind[])
        .filter((crd) => !state.get('kinds').has(referenceForCRD(crd)))
        .map((crd): K8sKind => {
          const {plural, singular, kind, shortNames} = crd.spec.names;
          const {version, scope, group, selector} = crd.spec;
          const {labels, annotations} = crd.metadata;

          const label = kind.replace(/([A-Z]+)/g, ' $1').slice(1);
          const abbr = shortNames ? shortNames[0].toUpperCase() : kind.replace(/([a-z+])/g, '');

          const namespaced = scope === 'Namespaced';
          if (namespaced) {
            namespacedResources.add(referenceForCRD(crd));
          } else {
            namespacedResources.delete(referenceForCRD(crd));
          }

          return {
            kind, label, plural, abbr, namespaced, labels, annotations, selector,
            apiGroup: group,
            labelPlural: `${label}${label.endsWith('s') ? 'es' : 's'}`,
            id: singular,
            apiVersion: version,
            path: plural,
            crd: true,
          };
        })
        .reduce((prevState, newModel) => {
          return prevState.update('kinds', (kinds) => kinds.set(referenceForModel(newModel), newModel));
        }, state)
        .set('inFlight', false);

    default:
      return state;
  }
};

export const connectToModel = connect((state, props: {kind: K8sResourceKindReference} & any) => {
  const ns: ImmutableMap<string, any> = state[kindReducerName];
  const kind = props.kind || _.get(props, 'match.params.plural');
  let kindObj;
  if (kind) {
    kindObj = ns.getIn(['kinds', kind]) || ns.getIn(['kinds', kindForReference(kind)]);
  }
  return {kindObj, kindsInFlight: ns.get(inFlight)} as any;
});

/**
 * @deprecated TODO(alecmerdler): `plural` is not a unique lookup key, remove uses of this
 */
export const connectToPlural = connect((state, props: {plural?: string, match: match<{plural: string}>}) => {
  const plural = props.plural || _.get(props, 'match.params.plural');
  const ns: ImmutableMap<string, any> = state[kindReducerName];
  const [refKey, kindObj] = ns.get('kinds').findEntry((v, k) => v.plural === plural || k === plural) || ['', undefined];

  return {kindObj, modelRef: refKey, kindsInFlight: ns.get(inFlight)} as any;
});

export const getCRDs = dispatch => {
  dispatch({type: 'getCRDsinflight'});

  return coFetchJSON('api/tectonic/crds')
    .then(
      res => dispatch({type: 'addCRDs', kinds: res.items}),
      res => {
        const status = _.get(res, 'response.status');
        if (status === 403 || status === 502) {
          return;
        }
        setTimeout(() => getCRDs(dispatch), 5000);
      }
    );
};
