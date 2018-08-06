/* eslint-disable no-unused-vars, no-undef */

import * as _ from 'lodash-es';
import { connect } from 'react-redux';
import { Map as ImmutableMap } from 'immutable';
import { match } from 'react-router-dom';

import { K8sKind, K8sResourceKindReference, kindForReference, GroupVersionKind, isGroupVersionKind } from './module/k8s';
import * as k8sModels from './models';

export const connectToModel = connect((state: State, props: {kind: K8sResourceKindReference} & any) => {
  const kind: string = props.kind || _.get(props, 'match.params.plural');

  const kindObj: K8sKind = !_.isEmpty(kind)
    ? (state.k8s.getIn(['RESOURCES', 'models', kind]) || state.k8s.getIn(['RESOURCES', 'models', kindForReference(kind)]))
    : null;

  return {kindObj, kindsInFlight: state.k8s.getIn(['RESOURCES', 'inFlight'])} as any;
});

type WithPluralProps = {
  kindObj?: K8sKind;
  modelRef?: K8sResourceKindReference;
  kindsInFlight?: boolean;
};

export type ConnectToPlural = <P extends WithPluralProps>(C: React.ComponentType<P>) =>
  React.ComponentType<Omit<P, keyof WithPluralProps>> & {WrappedComponent: React.ComponentType<P>};

/**
 * @deprecated TODO(alecmerdler): `plural` is not a unique lookup key, remove uses of this.
 * FIXME(alecmerdler): Not returning correctly typed `WrappedComponent`
 */
export const connectToPlural: ConnectToPlural = connect((state: State, props: {plural?: GroupVersionKind | string, match: match<{plural: GroupVersionKind | string}>}) => {
  const plural = props.plural || _.get(props, 'match.params.plural');

  const kindObj = isGroupVersionKind(plural)
    ? state.k8s.getIn(['RESOURCES', 'models']).get(plural)
    : _.find(k8sModels, model => model.plural === plural);

  const modelRef = isGroupVersionKind(plural) ? plural : _.get(kindObj, 'kind');

  return {kindObj, modelRef, kindsInFlight: state.k8s.getIn(['RESOURCES', 'inFlight'])};
});

type State = {k8s: ImmutableMap<string, any>};
