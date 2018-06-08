/* eslint-disable no-unused-vars, no-undef */

import * as _ from 'lodash-es';
import { connect } from 'react-redux';
import { Map as ImmutableMap } from 'immutable';
import { match } from 'react-router-dom';

import { K8sKind, K8sResourceKindReference, kindForReference } from './module/k8s';

export const kindReducerName = 'KINDS';
export const inFlight = 'inFlight';

export const connectToModel = connect((state: State, props: {kind: K8sResourceKindReference} & any) => {
  const kind: string = props.kind || _.get(props, 'match.params.plural');

  const kindObj: K8sKind = !_.isEmpty(kind)
    ? (state.k8s.getIn(['RESOURCES', 'models', kind]) || state.k8s.getIn(['RESOURCES', 'models', kindForReference(kind)]))
    : null;

  return {kindObj, kindsInFlight: state.k8s.getIn(['RESOURCES', inFlight])} as any;
});

/**
 * @deprecated TODO(alecmerdler): `plural` is not a unique lookup key, remove uses of this.
 * FIXME(alecmerdler): Not returning correctly typed `WrappedComponent`
 */
export const connectToPlural = connect((state: State, props: {plural?: string, match: match<{plural: string}>}) => {
  const plural = props.plural || _.get(props, 'match.params.plural');
  const [refKey, kindObj] = state.k8s.getIn(['RESOURCES', 'models']).findEntry((v, k) => v.plural === plural || k === plural) || ['', undefined];

  return {kindObj, modelRef: refKey, kindsInFlight: state.k8s.getIn(['RESOURCES', inFlight])} as any;
});

type State = {k8s: ImmutableMap<string, any>};
