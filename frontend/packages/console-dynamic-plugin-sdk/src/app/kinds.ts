import * as _ from 'lodash';
import { connect } from 'react-redux';
import { K8sKind, K8sResourceKindReference, kindForReference } from '@console/internal/module/k8s'; // ??! TODO - handle them
import { SDKStoreState } from './redux-types';

export const connectToModel = connect(
  (state: SDKStoreState, props: { kind: K8sResourceKindReference } & any) => {
    const kind: string = props.kind || _.get(props, 'match.params.plural');

    const kindObj: K8sKind = !_.isEmpty(kind)
      ? state.k8s.getIn(['RESOURCES', 'models', kind]) ||
        state.k8s.getIn(['RESOURCES', 'models', kindForReference(kind)])
      : null;

    return { kindObj, kindsInFlight: state.k8s.getIn(['RESOURCES', 'inFlight']) } as any;
  },
);
