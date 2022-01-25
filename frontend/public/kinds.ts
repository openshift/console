import * as _ from 'lodash-es';
import { connect } from 'react-redux';
import { match } from 'react-router-dom';

import {
  K8sKind,
  K8sResourceKindReference,
  GroupVersionKind,
  isGroupVersionKind,
  allModels,
  getGroupVersionKind,
} from './module/k8s';
import { RootState } from './redux';

export { connectToModel } from '@console/dynamic-plugin-sdk/src/app/kinds';

type WithPluralProps = {
  kindObj?: K8sKind;
  modelRef?: K8sResourceKindReference;
  kindsInFlight?: boolean;
};

export type ConnectToPlural = <P extends WithPluralProps>(
  C: React.ComponentType<P>,
) => React.ComponentType<Omit<P, keyof WithPluralProps>> & {
  WrappedComponent: React.ComponentType<P>;
};

/**
 * @deprecated TODO(alecmerdler): `plural` is not a unique lookup key, remove uses of this.
 * FIXME(alecmerdler): Not returning correctly typed `WrappedComponent`
 */
export const connectToPlural: ConnectToPlural = connect(
  (
    state: RootState,
    props: {
      plural?: GroupVersionKind | string;
      match: match<{ plural: GroupVersionKind | string }>;
    },
  ) => {
    const plural = props.plural || props.match?.params?.plural;

    const groupVersionKind = getGroupVersionKind(plural);

    let kindObj: K8sKind = null;
    if (groupVersionKind) {
      const [group, version, kind] = groupVersionKind;
      kindObj = allModels().find((model) => {
        return model.apiGroup === group && model.apiVersion === version && model.kind === kind;
      });

      if (!kindObj) {
        kindObj = state.k8s.getIn(['RESOURCES', 'models']).get(plural);
      }
    } else {
      kindObj = allModels().find(
        (model) => model.plural === plural && (!model.crd || model.legacyPluralURL),
      );
    }

    const modelRef = isGroupVersionKind(plural) ? plural : _.get(kindObj, 'kind');

    return { kindObj, modelRef, kindsInFlight: state.k8s.getIn(['RESOURCES', 'inFlight']) };
  },
);
