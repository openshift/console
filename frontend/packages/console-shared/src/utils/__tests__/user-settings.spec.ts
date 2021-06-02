import { coFetch } from '@console/internal/co-fetch';
import { ConfigMapKind } from '@console/internal/module/k8s';
import {
  createConfigMap,
  updateConfigMap,
  deseralizeData,
  seralizeData,
  USER_SETTING_CONFIGMAP_NAMESPACE,
} from '../user-settings';

const coFetchMock = coFetch as jest.Mock;

jest.mock('@console/internal/co-fetch', () => ({
  coFetch: jest.fn(),
}));

const configMap: ConfigMapKind = {
  apiVersion: 'v1',
  kind: 'ConfigMap',
  metadata: {
    name: `user-settings-1234`,
    namespace: USER_SETTING_CONFIGMAP_NAMESPACE,
  },
  data: {
    'devconsole.topology.anotherKey': 'true',
  },
};

beforeEach(() => {
  coFetchMock.mockClear();
});

describe('createConfigMap', () => {
  it('calls user settings api ', async () => {
    coFetchMock.mockReturnValueOnce({
      json: () => configMap,
    });

    const actual = await createConfigMap();

    expect(actual).toEqual(configMap);
    expect(coFetchMock).toHaveBeenCalledTimes(1);
    expect(coFetchMock).lastCalledWith('/api/console/user-settings', { method: 'POST' });
  });
});

describe('updateConfigMap', () => {
  it('calls user settings api ', async () => {
    coFetchMock.mockReturnValueOnce({
      json: () => configMap,
    });

    const actual = await updateConfigMap(configMap, 'key', 'value');

    expect(actual).toEqual(configMap);
    expect(coFetchMock).toHaveBeenCalledTimes(1);
    expect(coFetchMock).lastCalledWith(
      '/api/kubernetes/api/v1/namespaces/openshift-console-user-settings/configmaps/user-settings-1234',
      {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/merge-patch+json;charset=UTF-8',
        },
        body: '{"data":{"key":"value"}}',
      },
    );
  });
});

describe('deseralizeData', () => {
  it('does not convert null or undefined', () => {
    expect(deseralizeData(null)).toBe(null);
    expect(deseralizeData(undefined)).toBe(undefined);
  });

  it('converts valid json to an object', () => {
    expect(deseralizeData('{ "key": "value" }')).toEqual({ key: 'value' });
    expect(deseralizeData('1234')).toBe(1234);
    expect(deseralizeData('true')).toBe(true);
    expect(deseralizeData('false')).toBe(false);
  });

  it('return invalid json strings as string', () => {
    expect(deseralizeData('graph')).toBe('graph');
  });
});

describe('seralizeData', () => {
  it('does not convert strings', () => {
    expect(seralizeData('graph')).toBe('graph');
    expect(seralizeData('{ "key": "value" }')).toEqual('{ "key": "value" }');
  });

  it('converts objects', () => {
    expect(seralizeData({ key: 'value' })).toEqual('{"key":"value"}');
  });
});
