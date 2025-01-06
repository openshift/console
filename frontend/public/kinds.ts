import { connect, InferableComponentEnhancerWithProps } from 'react-redux';
import {
  K8sKind,
  K8sResourceKindReference,
  isGroupVersionKind,
  allModels,
  getGroupVersionKind,
} from './module/k8s';
import { RootState } from './redux';
import { getK8sModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sModel';
import { RouteMatch } from 'react-router-dom-v5-compat';

export type WithModelProps = {
  kindObj: K8sKind;
  kindsInFlight: boolean;
};
type WithModelOwnProps = {
  kind?: K8sResourceKindReference;
  match?: RouteMatch<'plural'>;
  params?: { plural: string };
};
type StateToProps = (state: RootState, ownProps: WithModelOwnProps) => WithModelProps;
const stateToProps: StateToProps = ({ k8s }, props) => {
  const kind: string = props.kind || props.match?.params?.plural || props.params?.plural;
  return {
    kindObj: getK8sModel(k8s, kind),
    kindsInFlight: k8s.getIn(['RESOURCES', 'inFlight']),
  };
};

/** @deprecated Use useK8sModel hook instead */
export const connectToModel: InferableComponentEnhancerWithProps<
  WithModelProps,
  WithModelOwnProps
> = connect(stateToProps);

type WithPluralProps = {
  kindObj?: K8sKind;
  modelRef?: K8sResourceKindReference;
  kindsInFlight?: boolean;
};
type WithPluralOwnProps = {
  plural?: string;
  match?: RouteMatch<'plural'>;
  params?: { plural?: string };
};
type MapStateToProps = (state: RootState, ownProps: WithPluralOwnProps) => WithPluralProps;
const mapStateToProps: MapStateToProps = ({ k8s }, props) => {
  const plural = props.plural || props.params?.plural || props.match?.params?.plural;
  const groupVersionKind = getGroupVersionKind(plural);

  let kindObj: K8sKind = null;
  if (groupVersionKind) {
    const [group, version, kind] = groupVersionKind;
    kindObj = allModels().find(
      (model) =>
        (model.apiGroup ?? 'core') === group && model.apiVersion === version && model.kind === kind,
    );

    if (!kindObj) {
      kindObj = getK8sModel(k8s, plural);
    }
  } else {
    kindObj = allModels().find(
      (model) => model.plural === plural && (!model.crd || model.legacyPluralURL),
    );
  }

  const modelRef = isGroupVersionKind(plural) ? plural : kindObj?.kind;

  return { kindObj, modelRef, kindsInFlight: k8s.getIn(['RESOURCES', 'inFlight']) };
};

/**
 * @deprecated TODO(alecmerdler): `plural` is not a unique lookup key, remove uses of this.
 * FIXME(alecmerdler): Not returning correctly typed `WrappedComponent`
 */
export const connectToPlural: InferableComponentEnhancerWithProps<
  WithPluralProps,
  WithPluralOwnProps
> = connect(mapStateToProps);
