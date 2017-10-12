/* eslint-disable no-undef */

import * as _ from 'lodash';
import {connect} from 'react-redux';
import * as Immutable from 'immutable';

import { k8sKinds } from './module/k8s/enum';
import { k8sBasePath } from './module/k8s';
import { coFetchJSON } from './co-fetch';
import { prefixes } from './ui/ui-actions';

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
  selector?: {matchLabels: {[key: string]: string}};
  labels?: {[key: string]: string};
  annotations?: {[key: string]: string};
};

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
        const { version, scope, group, selector } = resource.spec;
        const { labels, annotations } = resource.metadata;

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
          kind, label, plural, abbr, namespaced, labels, annotations, selector,
          labelPlural: `${label}${label.endsWith('s') ? 'es' : 's'}`,
          id: singular,
          apiVersion: version,
          path: plural,
          crd: true,
          basePath: `/apis/${group}/`,
        };
      });
      return state.merge({kinds: k8sKinds, inFlight: false});

    default:
      return state;
  }
};

export const stateToProps = (state, props): any => {
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
