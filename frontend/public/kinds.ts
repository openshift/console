/* eslint-disable no-undef */

import * as _ from 'lodash';
import {connect} from 'react-redux';
import * as Immutable from 'immutable';

import { k8sKinds } from './module/k8s/enum';
import { coFetchJSON } from './co-fetch';
import { prefixes } from './ui/ui-actions';

export type K8sFullyQualifiedResourceReference = {
    qualified: true;
    group: string;
    version: string;
    kind: string;
};

export type K8sResourceKindReference = string | K8sFullyQualifiedResourceReference;

export const getKindForResourceReference = (ref: K8sResourceKindReference) => {
  if ((ref as K8sFullyQualifiedResourceReference).qualified) {
    return (ref as K8sFullyQualifiedResourceReference).kind;
  }

  return (ref as string);
};

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

        // Always favor the static definitions
        // TODO: (kans) do not map to resource.spec.names.kind, since it isn't unique!
        if (k8sKinds[kind]) {
          return;
        }

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

  // TODO(jschorr): make this handle CRDs properly.
  const raw = ns.getIn(['kinds', getKindForResourceReference(props.kind)]);
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

const crdPath = `${(window as any).SERVER_FLAGS.basePath}api/tectonic/crds`;
export const getCRDs = dispatch => {
  dispatch({type: 'getCRDsinflight'});

  return coFetchJSON(crdPath)
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
