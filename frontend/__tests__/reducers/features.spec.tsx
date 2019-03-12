import * as React from 'react';
import * as Immutable from 'immutable';

import { setFlag } from '../../public/actions/features';
import { receivedResources } from '../../public/actions/k8s';
import { FLAGS } from '../../public/const';
import { featureReducer, defaults, connectToFlags } from '../../public/reducers/features';
import { ClusterServiceVersionModel } from '../../public/models';

describe('featureReducer', () => {

  it('returns default values if state is uninitialized', () => {
    const newState = featureReducer(null, null);

    expect(newState).toEqual(Immutable.Map(defaults));
  });

  it('returns updated state with new flags if `setFlag` action', () => {
    const action = setFlag(FLAGS.OPERATOR_LIFECYCLE_MANAGER, true);
    const initialState = Immutable.Map(defaults);
    const newState = featureReducer(initialState, action);

    expect(newState).toEqual(initialState.merge({[action.payload.flag]: action.payload.value}));
  });

  it('returns state if not `setFlag` action', () => {
    const action = {type: 'OTHER_ACTION'} as any;
    const initialState = Immutable.Map(defaults);
    const newState = featureReducer(initialState, action);

    expect(newState).toEqual(initialState);
  });

  it('sets flags when it gets CRDs', () => {
    const action = receivedResources({models: [ClusterServiceVersionModel], adminResources: [], allResources: [], configResources: [], namespacedSet: null, safeResources: [], preferredVersions: []});
    const initialState = Immutable.Map(defaults);
    const newState = featureReducer(initialState, action);

    expect(newState).toEqual(initialState.merge({
      [FLAGS.PROMETHEUS]: false,
      [FLAGS.CHARGEBACK]: false,
      [FLAGS.SERVICE_CATALOG]: false,
      [FLAGS.OPERATOR_LIFECYCLE_MANAGER]: true,
      [FLAGS.OPERATOR_HUB]: false,
      [FLAGS.CLUSTER_API]: false,
      [FLAGS.MACHINE_CONFIG]: false,
      [FLAGS.MACHINE_AUTOSCALER]: false,
      [FLAGS.CONSOLE_CLI_DOWNLOAD]: false,
      [FLAGS.CONSOLE_NOTIFICATION]: false,
    }));
  });
});

describe('connectToFlags', () => {
  type MyComponentProps = {propA: number, propB: boolean, flags: {[key: string]: boolean}};

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
