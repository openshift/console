import { act, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import {
  newPluginCSPViolationEvent,
  sameHostname,
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
  getPluginInfo: jest.fn().mockReturnValue([]),
};
jest.mock('@openshift/dynamic-plugin-sdk', () => ({
  ...jest.requireActual('@openshift/dynamic-plugin-sdk'),
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
    mockCacheEvent.mockClear();
  });

  it('records a new CSP violation', () => {
    mockCacheEvent.mockReturnValue(true);
    renderWithProviders(<TestComponent />);
    act(() => {
      fireEvent(document, testEvent);
    });
    expect(mockCacheEvent).toHaveBeenCalledWith(testPluginEvent);
    expect(mockFireTelemetry).toHaveBeenCalledWith('CSPViolation', testPluginEvent);
  });

  it('does not update store when matching event exists', () => {
    mockCacheEvent.mockReturnValue(false);
    renderWithProviders(<TestComponent />);

    act(() => {
      fireEvent(document, testEvent);
    });

    expect(mockCacheEvent).toHaveBeenCalledWith(testPluginEvent);
    expect(mockFireTelemetry).not.toHaveBeenCalled();
  });

  it('correctly parses plugin name from blockedURI', () => {
    mockCacheEvent.mockReturnValue(true);
    const testEventWithPlugin = new MockSecurityPolicyViolationEvent(
      'http://localhost/api/plugins/foo',
    );
    const expected = newPluginCSPViolationEvent('foo', testEventWithPlugin);
    renderWithProviders(<TestComponent />);
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
    renderWithProviders(<TestComponent />);
    act(() => {
      fireEvent(document, testEventWithPlugin);
    });
    expect(mockCacheEvent).toHaveBeenCalledWith(expected);
    expect(mockFireTelemetry).toHaveBeenCalledWith('CSPViolation', expected);
  });
});

describe('sameHostname', () => {
  // SecurityPolicyViolationEvent.blockedURI (and sourceFile) are not always absolute
  // URLs; they can be tokens like "inline", "eval", or an empty string. Regression
  // coverage for a crash where `new URL()` threw "Failed to construct 'URL': Invalid
  // URL" uncaught, breaking the entire app (e.g. when comparing Helm plugin CSP
  // violations whose blockedURI was "inline").
  it('returns true when hostnames match', () => {
    expect(sameHostname('http://example.com/a', 'http://example.com/b')).toBe(true);
  });

  it('returns false when hostnames differ', () => {
    expect(sameHostname('http://example.com', 'http://other.com')).toBe(false);
  });

  it.each([
    ['inline', 'inline'],
    ['eval', 'http://example.com'],
    ['', 'http://example.com'],
    ['inline', ''],
  ])('does not throw and returns false for non-URL tokens (%s, %s)', (a, b) => {
    expect(() => sameHostname(a, b)).not.toThrow();
    expect(sameHostname(a, b)).toBe(false);
  });
});
