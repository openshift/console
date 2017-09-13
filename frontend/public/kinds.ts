import * as _ from 'lodash';
import {connect} from 'react-redux';
import * as Immutable from 'immutable';

import { k8sKinds } from './module/k8s/enum';
import { k8sBasePath } from './module/k8s';
import { coFetchJSON } from './co-fetch';
import { prefixes } from './ui/ui-actions';

/* eslint-disable no-unused-vars,no-undef */
export type K8sKind = {
  abbr: string;
  kind: string;
  label: string;
  labelPlural: string;
  path: string;
  plural: string;

  apiVersion?: string;
  basePath?: string;
  namespaced?: boolean;
};
/* eslint-enable no-unused-vars,no-undef */

export const kindReducerName: string = 'KINDS';
export const inFlight: string = 'inFlight';

export const kindReducer = (state, action) => {
  if (!state) {
    return Immutable.fromJS({kinds: k8sKinds, inFlight: false});
  }

  switch (action.type) {
    case 'getCRDsinflight':
      return state.set(inFlight, true);

    case 'addCRDs':
      _.each(action.kinds, (resource: any) => {
        const { plural, singular, kind, shortNames } = resource.spec.names;
        const { version, scope, group } = resource.spec;
        const label = kind.replace(/([A-Z]+)/g, ' $1').slice(1);
        const abbr = shortNames
          ? shortNames[0].toUpperCase()
          : kind.replace(/([a-z+])/g, '');

        const namespaced = scope === 'Namespaced';
        if (namespaced) {
          prefixes.add(plural);
        } else {
          prefixes.delete(plural);
        }

        k8sKinds[kind] = {
          kind, label, plural, abbr, namespaced,
          labelPlural: `${label}${label.endsWith('s') ? 'es' : 's'}`,
          id: singular,
          apiVersion: version,
          path: plural,
          basePath: `/apis/${group}/`,
        };
      });
      return state.merge({kinds: k8sKinds, inFlight: false});

    default:
      return state;
  }
};

export const stateToProps = function (state, props): {kindObj: K8sKind | {}, kindsInFlight: boolean } {
  const ns = state[kindReducerName];
  const raw = ns.getIn(['kinds', props.kind]);
  return {kindObj: raw ? raw.toJSON() : {}, kindsInFlight: ns.get(inFlight)};
};

export const connectToKinds = () => connect(stateToProps);

export const connectToPlural = Component => connect((state, props: any) => {
  const plural = props.plural || _.get(props, 'match.params.plural');
  const ns = state[kindReducerName];
  const kindObj = ns.get('kinds').find(v => v.get('plural') === plural);
  return {kindObj: kindObj && kindObj.toJSON(), kindsInFlight: ns.get(inFlight)};
})(Component);

export const kindFromPlural = plural => _.find(k8sKinds, {plural});

const crdPath = `${k8sBasePath}/apis/apiextensions.k8s.io/v1beta1/customresourcedefinitions`;
export const getCRDs = dispatch => {
  dispatch({type: 'getCRDsinflight'});

  return coFetchJSON(crdPath)
    .then(res => dispatch({type: 'addCRDs', kinds: res.items}))
    .catch(() => setTimeout(() => getCRDs(dispatch), 5000));
};
