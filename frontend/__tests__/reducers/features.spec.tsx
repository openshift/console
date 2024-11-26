import * as React from 'react';
import * as Immutable from 'immutable';
import * as _ from 'lodash-es';

import { setFlag } from '../../public/actions/features';
import { receivedResources } from '../../public/actions/k8s';
import { FLAGS } from '@console/shared/src/constants';
import {
  featureReducer,
  featureReducerName,
  defaults,
  getFlagsObject,
  FeatureState,
} from '../../public/reducers/features';
import { connectToFlags, stateToFlagsObject } from '../../public/reducers/connectToFlags';
import { RootState } from '../../public/redux';

describe('featureReducer', () => {
  it('returns default values if state is uninitialized', () => {
    const newState = featureReducer(null, null);

    expect(newState).toEqual(
      Immutable.Map({
        AUTH_ENABLED: true,
        PROMETHEUS: undefined,
        OPENSHIFT: undefined,
        MONITORING: false,
        CAN_CREATE_NS: undefined,
        CAN_GET_NS: undefined,
        CAN_LIST_NS: undefined,
        CAN_LIST_NODE: undefined,
        CAN_LIST_PV: undefined,
        CAN_LIST_CRD: undefined,
        CAN_LIST_USERS: undefined,
        CAN_LIST_GROUPS: undefined,
        CAN_LIST_OPERATOR_GROUP: undefined,
        CAN_LIST_PACKAGE_MANIFEST: undefined,
        CAN_CREATE_PROJECT: undefined,
        CAN_LIST_VSC: undefined,
        CLUSTER_AUTOSCALER: undefined,
        SHOW_OPENSHIFT_START_GUIDE: undefined,
        CLUSTER_API: undefined,
        CLUSTER_VERSION: undefined,
        MACHINE_CONFIG: undefined,
        MACHINE_AUTOSCALER: undefined,
        MACHINE_HEALTH_CHECK: undefined,
        CONSOLE_LINK: undefined,
        CONSOLE_CLI_DOWNLOAD: undefined,
        CONSOLE_NOTIFICATION: undefined,
        CONSOLE_EXTERNAL_LOG_LINK: undefined,
        CONSOLE_YAML_SAMPLE: undefined,
        CONSOLE_QUICKSTART: undefined,
        CONSOLE_CAPABILITY_LIGHTSPEEDBUTTON_IS_ENABLED: undefined,
        CONSOLE_CAPABILITY_GETTINGSTARTEDBANNER_IS_ENABLED: undefined,
        LIGHTSPEED_IS_AVAILABLE_TO_INSTALL: undefined,
      }),
    );
  });

  it('returns updated state with new flags if `setFlag` action', () => {
    const action = setFlag(FLAGS.OPENSHIFT, true);
    const initialState = Immutable.Map(defaults);
    const newState = featureReducer(initialState, action);

    expect(newState).toEqual(initialState.merge({ [action.payload.flag]: action.payload.value }));
  });

  it('returns state if not `setFlag` action', () => {
    const action = { type: 'OTHER_ACTION' } as any;
    const initialState = Immutable.Map(defaults);
    const newState = featureReducer(initialState, action);

    expect(newState).toEqual(initialState);
  });

  it('sets flags when it gets CRDs', () => {
    const action = receivedResources({
      models: [],
      adminResources: [],
      allResources: [],
      configResources: [],
      clusterOperatorConfigResources: [],
      namespacedSet: null,
      safeResources: [],
      groupVersionMap: {},
    });
    const initialState = Immutable.Map(defaults);
    const newState = featureReducer(initialState, action);

    expect(newState).toEqual(
      initialState.merge({
        [FLAGS.PROMETHEUS]: false,
        [FLAGS.CLUSTER_API]: false,
        [FLAGS.MACHINE_CONFIG]: false,
        [FLAGS.MACHINE_AUTOSCALER]: false,
        [FLAGS.MACHINE_HEALTH_CHECK]: false,
        [FLAGS.CONSOLE_LINK]: false,
        [FLAGS.CONSOLE_CLI_DOWNLOAD]: false,
        [FLAGS.CONSOLE_NOTIFICATION]: false,
        [FLAGS.CONSOLE_EXTERNAL_LOG_LINK]: false,
        [FLAGS.CONSOLE_YAML_SAMPLE]: false,
        [FLAGS.CLUSTER_AUTOSCALER]: false,
      }),
    );
  });
});

describe('connectToFlags', () => {
  type MyComponentProps = { propA: number; propB: boolean; flags: { [key: string]: boolean } };

  class MyComponent extends React.Component<MyComponentProps> {
    render() {
      return <div>{this.props.propA}</div>;
    }
  }

  it('returns a component which preserves needed props and removes `flags` prop', () => {
    const MyComponentWithFlags = connectToFlags<MyComponentProps>()(MyComponent);
    const jsx = <MyComponentWithFlags propA={42} propB={false} />;

    expect(jsx).toBeDefined();
  });
});

describe('stateToFlagsObject', () => {
  it('maps the desired flags to a new object', () => {
    const featureState: FeatureState = Immutable.Map({
      FOO: true,
      BAR: false,
      QUX: undefined,
    });

    expect(
      _.isEqual(stateToFlagsObject(featureState, ['BAR', 'QUX']), {
        BAR: false,
        QUX: undefined,
      }),
    ).toBe(true);

    expect(
      _.isEqual(stateToFlagsObject(featureState, ['BAR', 'BAZ', 'QUX']), {
        BAR: false,
        BAZ: undefined,
        QUX: undefined,
      }),
    ).toBe(true);
  });
});

describe('getFlagsObject', () => {
  it('maps the root state to feature sub-state as a new object', () => {
    const featureState: FeatureState = Immutable.Map({
      FOO: true,
      BAR: false,
      QUX: undefined,
    });

    const rootState = {
      [featureReducerName]: featureState,
    };

    expect(
      _.isEqual(getFlagsObject(rootState as RootState), {
        FOO: true,
        BAR: false,
        QUX: undefined,
      }),
    ).toBe(true);
  });
});
