import * as React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { combineReducers, createStore, applyMiddleware } from 'redux';
import { receivedResources } from '@console/internal/actions/k8s';
import { ConfigMapModel, SecretModel } from '@console/internal/models';
import k8sReducers from '@console/internal/reducers/k8s';
import UIReducers from '@console/internal/reducers/ui';
import { thunk } from '@console/internal/redux';
import { useK8sModels } from '../useK8sModels';

// Redux wrapper
let store;
const Wrapper: React.FC = ({ children }) => <Provider store={store}>{children}</Provider>;

// Object under test
const modelUpdate = jest.fn();
const WatchModels: React.FC<{}> = () => {
  modelUpdate(...useK8sModels());
  return null;
};

beforeEach(() => {
  store = createStore(
    combineReducers({ k8s: k8sReducers, UI: UIReducers }),
    {},
    applyMiddleware(thunk),
  );
  modelUpdate.mockClear();
});

describe('useK8sModels', () => {
  it('should return in flight mode before resources are received', () => {
    render(
      <Wrapper>
        <WatchModels />
      </Wrapper>,
    );

    expect(modelUpdate).toHaveBeenCalledTimes(1);
    const [models, inFlight] = modelUpdate.mock.calls[0];
    expect(models).toEqual({});
    expect(inFlight).toBe(false); // TODO: Should be true?
  });

  it('should return all models as JSON', () => {
    store.dispatch(
      receivedResources({
        models: [ConfigMapModel, SecretModel],
        adminResources: [],
        allResources: [],
        configResources: [],
        clusterOperatorConfigResources: [],
        namespacedSet: null,
        safeResources: [],
        groupVersionMap: {},
      }),
    );

    render(
      <Wrapper>
        <WatchModels />
      </Wrapper>,
    );

    expect(modelUpdate).toHaveBeenCalledTimes(1);
    const [models, inFlight] = modelUpdate.mock.calls[0];
    expect(models).toEqual({ ConfigMap: ConfigMapModel, Secret: SecretModel });
    expect(inFlight).toBe(false);

    // It was saved in immutable redux store and will be cloned.
    expect(models.ConfigMap).not.toBe(ConfigMapModel);
    expect(models.Secret).not.toBe(SecretModel);
  });

  it('should return the same model JSON when rerendering', () => {
    store.dispatch(
      receivedResources({
        models: [ConfigMapModel, SecretModel],
        adminResources: [],
        allResources: [],
        configResources: [],
        clusterOperatorConfigResources: [],
        namespacedSet: null,
        safeResources: [],
        groupVersionMap: {},
      }),
    );

    const { rerender } = render(
      <Wrapper>
        <WatchModels />
      </Wrapper>,
    );
    rerender(
      <Wrapper>
        <WatchModels />
      </Wrapper>,
    );

    expect(modelUpdate).toHaveBeenCalledTimes(2);
    const [models1] = modelUpdate.mock.calls[0];
    const [models2] = modelUpdate.mock.calls[1];
    expect(models1).toEqual({ ConfigMap: ConfigMapModel, Secret: SecretModel });
    expect(models2).toEqual({ ConfigMap: ConfigMapModel, Secret: SecretModel });

    // It was saved in immutable redux store and will be cloned.
    expect(models1).not.toBe(models2);
    expect(models1.ConfigMap).toBe(models2.ConfigMap);
    expect(models1.Secret).toBe(models2.Secret);
  });

  it('should return the same model JSON when rendering twice', () => {
    store.dispatch(
      receivedResources({
        models: [ConfigMapModel, SecretModel],
        adminResources: [],
        allResources: [],
        configResources: [],
        clusterOperatorConfigResources: [],
        namespacedSet: null,
        safeResources: [],
        groupVersionMap: {},
      }),
    );

    render(
      <Wrapper>
        <WatchModels />
        <WatchModels />
      </Wrapper>,
    );

    expect(modelUpdate).toHaveBeenCalledTimes(2);
    const [models1] = modelUpdate.mock.calls[0];
    const [models2] = modelUpdate.mock.calls[1];
    expect(models1).toEqual({ ConfigMap: ConfigMapModel, Secret: SecretModel });
    expect(models2).toEqual({ ConfigMap: ConfigMapModel, Secret: SecretModel });

    // It was saved in immutable redux store and will be cloned.
    expect(models1).not.toBe(models2);
    expect(models1.ConfigMap).toBe(models2.ConfigMap);
    expect(models1.Secret).toBe(models2.Secret);
  });
});
