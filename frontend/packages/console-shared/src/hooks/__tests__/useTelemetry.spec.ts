import { renderHook } from '@testing-library/react';
import {
  useResolvedExtensions,
  ResolvedExtension,
  TelemetryListener,
} from '@console/dynamic-plugin-sdk';
import {
  CLUSTER_TELEMETRY_ANALYTICS,
  USER_TELEMETRY_ANALYTICS,
  useUserSettings,
} from '@console/shared';
import {
  getClusterProperties,
  updateClusterPropertiesFromTests,
  useTelemetry,
} from '../useTelemetry';

jest.mock('@console/dynamic-plugin-sdk', () => ({
  ...jest.requireActual('@console/dynamic-plugin-sdk'),
  useResolvedExtensions: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useUserSettings', () => ({
  useUserSettings: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useUser', () => ({
  useUser: jest.fn(() => ({
    user: {},
    userResource: {},
    userResourceLoaded: true,
    userResourceError: null,
    username: 'testuser',
    fullName: 'Test User',
    displayName: 'Test User',
  })),
}));

const mockUserResource = {};

const exampleReturnValue = {
  accountMail: undefined,
  clusterId: undefined,
  clusterType: undefined,
  consoleVersion: undefined,
  organizationId: undefined,
  path: undefined,
  userResource: mockUserResource,
};

jest.mock('@console/internal/components/utils/k8s-get-hook', () => ({
  useK8sGet: () => [mockUserResource, true],
}));

const mockUserSettings = useUserSettings as jest.Mock;

const useResolvedExtensionsMock = useResolvedExtensions as jest.Mock;

let originServerFlags;

beforeAll(() => {
  originServerFlags = window.SERVER_FLAGS || {};
});

afterAll(() => {
  window.SERVER_FLAGS = originServerFlags;
});

describe('getClusterProperties', () => {
  it('prefers releaseVersion to consoleVersion', () => {
    window.SERVER_FLAGS = {
      ...originServerFlags,
      releaseVersion: '4.17.4',
      consoleVersion: 'v6.0.6-23079-g6689498225',
    };
    expect(getClusterProperties().consoleVersion).toBe('4.17.4');
  });

  it('falls back to consoleVersion if releaseVersion is not set', () => {
    window.SERVER_FLAGS = { ...originServerFlags, consoleVersion: 'v6.0.6-23079-g6689498225' };
    delete window.SERVER_FLAGS.releaseVersion;
    expect(getClusterProperties().consoleVersion).toBe('v6.0.6-23079-g6689498225');
  });

  it('returns undefined when releaseVersion and consoleVersion are not set', () => {
    window.SERVER_FLAGS = { ...originServerFlags };
    delete window.SERVER_FLAGS.consoleVersion;
    delete window.SERVER_FLAGS.releaseVersion;
    expect(getClusterProperties().consoleVersion).toBe(undefined);
  });

  it('returns undefined when telemetry is missing at all', () => {
    window.SERVER_FLAGS = { ...originServerFlags };
    delete window.SERVER_FLAGS.telemetry;
    expect(getClusterProperties().clusterType).toBe(undefined);
  });

  it('returns undefined when telemetry configuration is empty', () => {
    window.SERVER_FLAGS = { ...originServerFlags, telemetry: {} };
    expect(getClusterProperties().clusterType).toBe(undefined);
  });

  it('returns the clusterType that it is configured', () => {
    window.SERVER_FLAGS = { ...originServerFlags, telemetry: { CLUSTER_TYPE: 'TEST' } };
    expect(getClusterProperties().clusterType).toBe('TEST');
  });

  it('returns DEVSANDBOX when CLUSTER_TYPE is "OSD" but and DEVSANDBOX is "true"', () => {
    window.SERVER_FLAGS = {
      ...originServerFlags,
      telemetry: { CLUSTER_TYPE: 'OSD', DEVSANDBOX: 'true' },
    };
    expect(getClusterProperties().clusterType).toBe('DEVSANDBOX');
  });

  it('returns the clusterType that it is configured if CLUSTER_TYPE is not OSD (in the future) but DEVSANDBOX is still "true"', () => {
    window.SERVER_FLAGS = {
      ...originServerFlags,
      telemetry: { CLUSTER_TYPE: 'a_FUTURE_DEVSANDBOX_KEY', DEVSANDBOX: 'true' },
    };
    expect(getClusterProperties().clusterType).toBe('a_FUTURE_DEVSANDBOX_KEY');
  });

  it('returns the clusterType that it is configured if CLUSTER_TYPE is OSD but DEVSANDBOX is not exactly "true"', () => {
    window.SERVER_FLAGS = {
      ...originServerFlags,
      telemetry: { CLUSTER_TYPE: 'OSD', DEVSANDBOX: 'false' },
    };
    expect(getClusterProperties().clusterType).toBe('OSD');
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
        pluginName: 'mock-pluginName',
        properties: {
          listener,
        },
      },
    ];
    mockUserSettings.mockReturnValue(['', jest.fn(), true]);
    useResolvedExtensionsMock.mockReturnValue([extensions]);
  });

  it('calls the listener with console version and clusterType as undefined when they are not configured', () => {
    window.SERVER_FLAGS = { ...originServerFlags };
    delete window.SERVER_FLAGS.consoleVersion;
    delete window.SERVER_FLAGS.telemetry;
    window.SERVER_FLAGS = {
      ...window.SERVER_FLAGS,
      telemetry: { STATE: CLUSTER_TELEMETRY_ANALYTICS.ENFORCE },
    };
    updateClusterPropertiesFromTests();
    const { result } = renderHook(() => useTelemetry());
    const fireTelemetryEvent = result.current;
    fireTelemetryEvent('test 1');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith('test 1', {
      ...exampleReturnValue,
      clusterType: undefined,
      consoleVersion: undefined,
    });
  });

  it('calls the listener with console version and clusterType when they are configured (x.y.z and OSD)', () => {
    window.SERVER_FLAGS = {
      ...originServerFlags,
      consoleVersion: 'x.y.z',
      telemetry: { CLUSTER_TYPE: 'OSD', STATE: CLUSTER_TELEMETRY_ANALYTICS.ENFORCE },
    };
    updateClusterPropertiesFromTests();
    const { result } = renderHook(() => useTelemetry());
    const fireTelemetryEvent = result.current;
    fireTelemetryEvent('test 2');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith('test 2', {
      ...exampleReturnValue,
      clusterType: 'OSD',
      consoleVersion: 'x.y.z',
    });
  });

  it('calls the listener with the optional properties', () => {
    window.SERVER_FLAGS = {
      ...originServerFlags,
      consoleVersion: 'x.y.z',
      telemetry: { CLUSTER_TYPE: 'OSD', STATE: CLUSTER_TELEMETRY_ANALYTICS.ENFORCE },
    };
    updateClusterPropertiesFromTests();
    const { result } = renderHook(() => useTelemetry());
    const fireTelemetryEvent = result.current;
    fireTelemetryEvent('test 3', { 'a-string': 'works fine', 'a-boolean': true });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith('test 3', {
      ...exampleReturnValue,
      'a-boolean': true,
      'a-string': 'works fine',
      clusterType: 'OSD',
      consoleVersion: 'x.y.z',
    });
  });

  it('calls the listener with clusterType DEVSANDBOX when CLUSTER_TYPE is OSD and DEVSANDBOX is "true"', () => {
    window.SERVER_FLAGS = {
      ...originServerFlags,
      consoleVersion: 'x.y.z',
      telemetry: {
        CLUSTER_TYPE: 'OSD',
        DEVSANDBOX: 'true',
        STATE: CLUSTER_TELEMETRY_ANALYTICS.ENFORCE,
      },
    };
    updateClusterPropertiesFromTests();
    const { result } = renderHook(() => useTelemetry());
    const fireTelemetryEvent = result.current;
    fireTelemetryEvent('test 4');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith('test 4', {
      ...exampleReturnValue,
      clusterType: 'DEVSANDBOX',
      consoleVersion: 'x.y.z',
    });
  });

  it('Should not send telemetry event when cluster configuration telemetry state is set to disabled', () => {
    window.SERVER_FLAGS = {
      ...originServerFlags,
      consoleVersion: 'x.y.z',
      telemetry: {
        CLUSTER_TYPE: 'OSD',
        DEVSANDBOX: 'true',
        STATE: CLUSTER_TELEMETRY_ANALYTICS.DISABLED,
      },
    };
    updateClusterPropertiesFromTests();
    const { result } = renderHook(() => useTelemetry());
    const fireTelemetryEvent = result.current;
    fireTelemetryEvent('test 5');
    expect(listener).toHaveBeenCalledTimes(0);
  });

  it('Should send telemetry event when cluster configuration telemetry state is set to opt-in and user accepted to send telemetry event', () => {
    window.SERVER_FLAGS = {
      ...originServerFlags,
      consoleVersion: 'x.y.z',
      telemetry: {
        CLUSTER_TYPE: 'OSD',
        DEVSANDBOX: 'true',
        STATE: CLUSTER_TELEMETRY_ANALYTICS.OPTIN,
      },
    };
    mockUserSettings.mockReturnValue([USER_TELEMETRY_ANALYTICS.ALLOW, jest.fn(), true]);
    updateClusterPropertiesFromTests();
    const { result } = renderHook(() => useTelemetry());
    const fireTelemetryEvent = result.current;
    fireTelemetryEvent('test 6');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('Should not send telemetry event when cluster configuration telemetry state is set to opt-in and user denied to send telemetry event', () => {
    window.SERVER_FLAGS = {
      ...originServerFlags,
      consoleVersion: 'x.y.z',
      telemetry: {
        CLUSTER_TYPE: 'OSD',
        DEVSANDBOX: 'true',
        STATE: CLUSTER_TELEMETRY_ANALYTICS.OPTIN,
      },
    };
    mockUserSettings.mockReturnValue([USER_TELEMETRY_ANALYTICS.DENY, jest.fn(), true]);
    updateClusterPropertiesFromTests();
    const { result } = renderHook(() => useTelemetry());
    const fireTelemetryEvent = result.current;
    fireTelemetryEvent('test 7');
    expect(listener).toHaveBeenCalledTimes(0);
  });

  it('Should send telemetry event when cluster configuration telemetry state is set to opt-out and user accepted to send telemetry event', () => {
    window.SERVER_FLAGS = {
      ...originServerFlags,
      consoleVersion: 'x.y.z',
      telemetry: {
        CLUSTER_TYPE: 'OSD',
        DEVSANDBOX: 'true',
        STATE: CLUSTER_TELEMETRY_ANALYTICS.OPTOUT,
      },
    };
    mockUserSettings.mockReturnValue([USER_TELEMETRY_ANALYTICS.ALLOW, jest.fn(), true]);
    updateClusterPropertiesFromTests();
    const { result } = renderHook(() => useTelemetry());
    const fireTelemetryEvent = result.current;
    fireTelemetryEvent('test 8');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('Should not send telemetry event when cluster configuration telemetry state is set to opt-out and user denied to send telemetry event', () => {
    window.SERVER_FLAGS = {
      ...originServerFlags,
      consoleVersion: 'x.y.z',
      telemetry: {
        CLUSTER_TYPE: 'OSD',
        DEVSANDBOX: 'true',
        STATE: CLUSTER_TELEMETRY_ANALYTICS.OPTOUT,
      },
    };
    mockUserSettings.mockReturnValue([USER_TELEMETRY_ANALYTICS.DENY, jest.fn(), true]);
    updateClusterPropertiesFromTests();
    const { result } = renderHook(() => useTelemetry());
    const fireTelemetryEvent = result.current;
    fireTelemetryEvent('test 9');
    expect(listener).toHaveBeenCalledTimes(0);
  });

  it('Should not send telemetry event when cluster configuration telemetry state is set to opt-in and user not accepted or denied to send telemetry event', () => {
    window.SERVER_FLAGS = {
      ...originServerFlags,
      consoleVersion: 'x.y.z',
      telemetry: {
        CLUSTER_TYPE: 'OSD',
        DEVSANDBOX: 'true',
        STATE: CLUSTER_TELEMETRY_ANALYTICS.OPTIN,
      },
    };
    mockUserSettings.mockReturnValue(['', jest.fn(), true]);
    updateClusterPropertiesFromTests();
    const { result } = renderHook(() => useTelemetry());
    const fireTelemetryEvent = result.current;
    fireTelemetryEvent('test 10');
    expect(listener).toHaveBeenCalledTimes(0);
  });

  it('Should send telemetry event when cluster configuration telemetry state is set to enforce', () => {
    window.SERVER_FLAGS = {
      ...originServerFlags,
      consoleVersion: 'x.y.z',
      telemetry: {
        CLUSTER_TYPE: 'OSD',
        DEVSANDBOX: 'true',
        STATE: CLUSTER_TELEMETRY_ANALYTICS.ENFORCE,
      },
    };
    updateClusterPropertiesFromTests();
    const { result } = renderHook(() => useTelemetry());
    const fireTelemetryEvent = result.current;
    fireTelemetryEvent('test 11');
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
