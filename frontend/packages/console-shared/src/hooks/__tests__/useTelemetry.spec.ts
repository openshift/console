import {
  useResolvedExtensions,
  ResolvedExtension,
  TelemetryListener,
} from '@console/dynamic-plugin-sdk';
import { testHook } from '../../../../../__tests__/utils/hooks-utils';
import {
  getConsoleVersion,
  getClusterType,
  updateServerFlagsFromTests,
  useTelemetry,
} from '../useTelemetry';

jest.mock('@console/dynamic-plugin-sdk', () => ({
  ...require.requireActual('@console/dynamic-plugin-sdk'),
  useResolvedExtensions: jest.fn(),
}));

const useResolvedExtensionsMock = useResolvedExtensions as jest.Mock;

let originServerFlags;

beforeAll(() => {
  originServerFlags = window.SERVER_FLAGS || {};
});

afterAll(() => {
  window.SERVER_FLAGS = originServerFlags;
});

describe('getConsoleVersion', () => {
  it('returns undefined when consoleVersion is not configured', () => {
    window.SERVER_FLAGS = { ...originServerFlags };
    delete window.SERVER_FLAGS.consoleVersion;
    expect(getConsoleVersion()).toBe(undefined);
  });

  it('returns the right version when it is configured', () => {
    window.SERVER_FLAGS = { ...originServerFlags, consoleVersion: 'x.y.z' };
    expect(getConsoleVersion()).toBe('x.y.z');
  });
});

describe('getClusterType', () => {
  it('returns undefined when telemetry is missing at all', () => {
    window.SERVER_FLAGS = { ...originServerFlags };
    delete window.SERVER_FLAGS.telemetry;
    expect(getClusterType()).toBe(undefined);
  });

  it('returns undefined when telemetry configuration is empty', () => {
    window.SERVER_FLAGS = { ...originServerFlags, telemetry: {} };
    expect(getClusterType()).toBe(undefined);
  });

  it('returns the clusterType that it is configured', () => {
    window.SERVER_FLAGS = { ...originServerFlags, telemetry: { CLUSTER_TYPE: 'TEST' } };
    expect(getClusterType()).toBe('TEST');
  });

  it('returns DEVSANDBOX when CLUSTER_TYPE is "OSD" but and DEVSANDBOX is "true"', () => {
    window.SERVER_FLAGS = {
      ...originServerFlags,
      telemetry: { CLUSTER_TYPE: 'OSD', DEVSANDBOX: 'true' },
    };
    expect(getClusterType()).toBe('DEVSANDBOX');
  });

  it('returns the clusterType that it is configured if CLUSTER_TYPE is not OSD (in the future) but DEVSANDBOX is still "true"', () => {
    window.SERVER_FLAGS = {
      ...originServerFlags,
      telemetry: { CLUSTER_TYPE: 'a_FUTURE_DEVSANDBOX_KEY', DEVSANDBOX: 'true' },
    };
    expect(getClusterType()).toBe('a_FUTURE_DEVSANDBOX_KEY');
  });

  it('returns the clusterType that it is configured if CLUSTER_TYPE is OSD but DEVSANDBOX is not exactly "true"', () => {
    window.SERVER_FLAGS = {
      ...originServerFlags,
      telemetry: { CLUSTER_TYPE: 'OSD', DEVSANDBOX: 'false' },
    };
    expect(getClusterType()).toBe('OSD');
  });
});

describe('useTelemetry', () => {
  const listener = jest.fn();

  beforeEach(() => {
    listener.mockReset();
    const extensions: ResolvedExtension<TelemetryListener>[] = [
      {
        type: 'console.telemetry/listener',
        uid: 'mock-uid',
        pluginID: 'mock-pluginID',
        pluginName: 'mock-pluginName',
        properties: {
          listener,
        },
      },
    ];
    useResolvedExtensionsMock.mockReturnValue([extensions]);
  });

  it('calls the listener with console version and clusterType as undefined when they are not configured', () => {
    window.SERVER_FLAGS = { ...originServerFlags };
    delete window.SERVER_FLAGS.consoleVersion;
    delete window.SERVER_FLAGS.telemetry;
    updateServerFlagsFromTests();
    const { result } = testHook(() => useTelemetry());
    const fireTelemetryEvent = result.current;
    fireTelemetryEvent('test 1');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toBeCalledWith('test 1', {
      consoleVersion: undefined,
      clusterType: undefined,
    });
  });

  it('calls the listener with console version and clusterType when they are configured (x.y.z and OSD)', () => {
    window.SERVER_FLAGS = {
      ...originServerFlags,
      consoleVersion: 'x.y.z',
      telemetry: { CLUSTER_TYPE: 'OSD' },
    };
    updateServerFlagsFromTests();
    const { result } = testHook(() => useTelemetry());
    const fireTelemetryEvent = result.current;
    fireTelemetryEvent('test 2');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toBeCalledWith('test 2', {
      consoleVersion: 'x.y.z',
      clusterType: 'OSD',
    });
  });

  it('calls the listener with the optional properties', () => {
    window.SERVER_FLAGS = {
      ...originServerFlags,
      consoleVersion: 'x.y.z',
      telemetry: { CLUSTER_TYPE: 'OSD' },
    };
    updateServerFlagsFromTests();
    const { result } = testHook(() => useTelemetry());
    const fireTelemetryEvent = result.current;
    fireTelemetryEvent('test 3', { 'a-string': 'works fine', 'a-boolean': true });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toBeCalledWith('test 3', {
      consoleVersion: 'x.y.z',
      clusterType: 'OSD',
      'a-string': 'works fine',
      'a-boolean': true,
    });
  });

  it('calls the listener with clusterType DEVSANDBOX when CLUSTER_TYPE is OSD and DEVSANDBOX is "true"', () => {
    window.SERVER_FLAGS = {
      ...originServerFlags,
      consoleVersion: 'x.y.z',
      telemetry: { CLUSTER_TYPE: 'OSD', DEVSANDBOX: 'true' },
    };
    updateServerFlagsFromTests();
    const { result } = testHook(() => useTelemetry());
    const fireTelemetryEvent = result.current;
    fireTelemetryEvent('test 4');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toBeCalledWith('test 4', {
      consoleVersion: 'x.y.z',
      clusterType: 'DEVSANDBOX',
    });
  });
});
