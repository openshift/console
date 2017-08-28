import * as _ from 'lodash';
import {connect} from 'react-redux';
import * as Immutable from 'immutable';

import { k8sKinds } from './module/k8s/enum';


/* eslint-disable no-unused-vars,no-undef */
type K8sKind = {
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

export const kindReducer = state => {
  if (!state) {
    return Immutable.fromJS(k8sKinds);
  }
  return state;
};

export const stateToProps = function (state, props): {kindObj: K8sKind | {}} {
  const raw = state[kindReducerName].get(props.kind);
  return {kindObj: raw ? raw.toJSON() : {}};
};

export const connectToKinds = () => connect(stateToProps);

export const connectToPlural = Component => connect((state, props) => {
  const plural = props.plural || _.get(props, 'match.params.plural');
  const kindObj = state[kindReducerName].find(v => v.get('plural') === plural);
  return {kindObj: kindObj && kindObj.toJSON()};
})(Component);

export const kindFromPlural = plural => _.find(k8sKinds, {plural});
