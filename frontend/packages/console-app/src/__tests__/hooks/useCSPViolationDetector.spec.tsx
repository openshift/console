import { act, fireEvent, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import store from '@console/internal/redux';
import {
  newPluginCSPViolationEvent,
  useCSPViolationDetector,
} from '../../hooks/useCSPViolationDetector';

jest.mock('@console/shared/src/constants/common', () => ({
  ...jest.requireActual('@console/shared/src/constants/common'),
  IS_PRODUCTION: true,
}));

const mockCacheEvent = jest.fn();
jest.mock('@console/shared/src/hooks/useLocalStorageCache', () => ({
  useLocalStorageCache: () => [undefined, mockCacheEvent],
}));

const mockFireTelemetry = jest.fn();
jest.mock('@console/shared/src/hooks/useTelemetry', () => ({
  useTelemetry: () => mockFireTelemetry,
}));

const mockPluginStore = {
  findDynamicPluginInfo: jest.fn(),
  setCustomDynamicPluginInfo: jest.fn(),
};
jest.mock('@console/plugin-sdk/src/api/usePluginStore', () => ({
  usePluginStore: () => mockPluginStore,
}));

class MockSecurityPolicyViolationEvent extends Event {
  documentURI;

  violatedDirective;

  originalPolicy;

  blockedURI;

  lineNumber;

  columnNumber;

  statusCode;

  sourceFile;

  disposition;

  effectiveDirective;

  referrer;

  sample;

  constructor(blockedURI?: string, sourceFile?: string, documentURI?: string) {
    super('securitypolicyviolation');
    this.blockedURI = blockedURI || 'http://blocked.com';
    this.sourceFile = sourceFile || 'http://example.com/test.js';
    this.documentURI = documentURI || 'http://localhost:9000/test';
  }
}
const testEvent = new MockSecurityPolicyViolationEvent();
const testPluginEvent = newPluginCSPViolationEvent(null, testEvent);

const TestComponent = () => {
  useCSPViolationDetector();
  return <div>hello, world!</div>;
};

describe('useCSPViolationDetector', () => {
  afterEach(() => {
    mockFireTelemetry.mockClear();
    mockPluginStore.findDynamicPluginInfo.mockClear();
    mockPluginStore.setCustomDynamicPluginInfo.mockClear();
    mockCacheEvent.mockClear();
  });

  it('records a new CSP violation', () => {
    mockCacheEvent.mockReturnValue(true);
    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>,
    );
    act(() => {
      fireEvent(document, testEvent);
    });
    expect(mockCacheEvent).toHaveBeenCalledWith(testPluginEvent);
    expect(mockFireTelemetry).toHaveBeenCalledWith('CSPViolation', testPluginEvent);
  });

  it('does not update store when matching event exists', () => {
    mockCacheEvent.mockReturnValue(false);
    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>,
    );

    act(() => {
      fireEvent(document, testEvent);
    });

    expect(mockCacheEvent).toHaveBeenCalledWith(testPluginEvent);
    expect(mockFireTelemetry).not.toBeCalled();
  });

  it('correctly parses plugin name from blockedURI', () => {
    mockCacheEvent.mockReturnValue(true);
    const testEventWithPlugin = new MockSecurityPolicyViolationEvent(
      'http://localhost/api/plugins/foo',
    );
    const expected = newPluginCSPViolationEvent('foo', testEventWithPlugin);
    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>,
    );
    act(() => {
      fireEvent(document, testEventWithPlugin);
    });
    expect(mockCacheEvent).toHaveBeenCalledWith(expected);
    expect(mockFireTelemetry).toHaveBeenCalledWith('CSPViolation', expected);
  });

  it('correctly parses plugin name from sourceFile', () => {
    mockCacheEvent.mockReturnValue(true);
    const testEventWithPlugin = new MockSecurityPolicyViolationEvent(
      'http://blocked.com',
      'http://localhost/api/plugins/foo',
    );
    const expected = newPluginCSPViolationEvent('foo', testEventWithPlugin);
    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>,
    );
    act(() => {
      fireEvent(document, testEventWithPlugin);
    });
    expect(mockCacheEvent).toHaveBeenCalledWith(expected);
    expect(mockFireTelemetry).toHaveBeenCalledWith('CSPViolation', expected);
  });
});
