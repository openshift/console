import * as React from 'react';
import * as Immutable from 'immutable';
import * as _ from 'lodash-es';

import { setFlag } from '../../public/actions/features';
import { receivedResources } from '../../public/actions/k8s';
import { FLAGS } from '@console/shared';
import {
  featureReducer,
  featureReducerName,
  defaults,
  connectToFlags,
  stateToFlagsObject,
  getFlagsObject,
  FeatureState,
} from '../../public/reducers/features';
import { RootState } from '../../public/redux';

describe('featureReducer', () => {
  it('returns default values if state is uninitialized', () => {
    const newState = featureReducer(null, null);

    expect(newState).toEqual(Immutable.Map(defaults));
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
      namespacedSet: null,
      safeResources: [],
      groupVersionMap: {},
    });
    const initialState = Immutable.Map(defaults);
    const newState = featureReducer(initialState, action);

    expect(newState).toEqual(
      initialState.merge({
        [FLAGS.PROMETHEUS]: false,
        [FLAGS.CHARGEBACK]: false,
        [FLAGS.SERVICE_CATALOG]: false,
        [FLAGS.CLUSTER_API]: false,
        [FLAGS.MACHINE_CONFIG]: false,
        [FLAGS.MACHINE_AUTOSCALER]: false,
        [FLAGS.MACHINE_HEALTH_CHECK]: false,
        [FLAGS.CONSOLE_CLI_DOWNLOAD]: false,
        [FLAGS.CONSOLE_NOTIFICATION]: false,
        [FLAGS.CONSOLE_EXTERNAL_LOG_LINK]: false,
        [FLAGS.CONSOLE_YAML_SAMPLE]: false,
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
