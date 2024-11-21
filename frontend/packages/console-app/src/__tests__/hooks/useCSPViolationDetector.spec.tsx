import * as React from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import store from '@console/internal/redux';
import { ONE_DAY } from '@console/shared/src/constants/time';
import {
  newCSPViolationReport,
  useCSPViolationDetector,
} from '../../hooks/useCSPVioliationDetector';

// Mock Date.now so that it returns a predictable value
const now = Date.now();
const mockNow = jest.spyOn(Date, 'now').mockReturnValue(now);

// Mock localStorage so that we can spy on calls and override return values.
const mockGetItem = jest.fn();
const mockSetItem = jest.fn();
class LocalStorageMock {
  store = {};

  length = 0;

  clear = jest.fn();

  getItem = mockGetItem;

  setItem = mockSetItem;

  removeItem = jest.fn();

  key = jest.fn();
}
window.localStorage = new LocalStorageMock();

// Mock fireTelemetry so that we can spy on calls
const mockFireTelemetry = jest.fn();
jest.mock('@console/shared/src/hooks/useTelemetry', () => ({
  useTelemetry: () => mockFireTelemetry,
}));

// Mock class that extends SecurityPolicyViolationEvent to work around "SecurityPolicyViolationEvent
// is not defined" error
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

  constructor(blockedURI?: string, sourceFile?: string) {
    super('securitypolicyviolation');
    this.blockedURI = blockedURI || 'http://blocked.com';
    this.sourceFile = sourceFile || 'http://example.com/test.js';
  }
}
const testEvent = new MockSecurityPolicyViolationEvent();
const testReport = newCSPViolationReport(null, testEvent);
const testRecord = {
  ...testReport,
  timestamp: now,
};
const existingRecord = {
  ...testReport,
  timestamp: now - ONE_DAY,
};
const expiredRecord = {
  ...testReport,
  timestamp: now - 2 * ONE_DAY,
};
const TestComponent = () => {
  useCSPViolationDetector();
  return <div>hello, world!</div>;
};

describe('useCSPViolationDetector', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  beforeAll(() => {
    process.env.NODE_ENV = 'production';
  });
  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });
  afterEach(() => {
    mockGetItem.mockClear();
    mockSetItem.mockClear();
    mockFireTelemetry.mockClear();
    mockNow.mockClear();
  });

  it('records a new CSP violation', () => {
    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>,
    );
    mockGetItem.mockReturnValueOnce('[]');
    act(() => {
      fireEvent(document, testEvent);
    });
    expect(mockSetItem).toHaveBeenCalledWith(
      'console/csp_violations',
      JSON.stringify([testRecord]),
    );
    expect(mockFireTelemetry).toHaveBeenCalledWith('CSPViolation', testRecord);
  });

  it('updates existing events with new timestamp', () => {
    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>,
    );

    mockGetItem.mockReturnValueOnce(JSON.stringify([existingRecord]));

    act(() => {
      fireEvent(document, testEvent);
    });

    expect(mockSetItem).toBeCalledWith('console/csp_violations', JSON.stringify([testRecord]));
    expect(mockFireTelemetry).not.toBeCalled();
  });
  it('fires a telemetry event when a matching CSP expires', () => {
    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>,
    );

    mockGetItem.mockReturnValueOnce(JSON.stringify([expiredRecord]));

    const origNodeEnv = process.env.NODE_ENV;
    act(() => {
      fireEvent(document, testEvent);
    });
    process.env.NODE_ENV = origNodeEnv;
    expect(mockSetItem).toHaveBeenCalledWith(
      'console/csp_violations',
      JSON.stringify([testRecord]),
    );
    expect(mockFireTelemetry).toHaveBeenCalledWith('CSPViolation', testRecord);
  });
  it('correctly parses plugin name from blockedURI', () => {
    const testEventWithPlugin = new MockSecurityPolicyViolationEvent(
      'http://localhost/api/plugins/foo',
    );
    const report = newCSPViolationReport('foo', testEventWithPlugin);
    const record = {
      ...report,
      timestamp: 999,
    };
    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>,
    );
    mockNow.mockReturnValueOnce(999);
    mockGetItem.mockReturnValueOnce('');
    act(() => {
      fireEvent(document, testEventWithPlugin);
    });
    expect(mockSetItem).toHaveBeenCalledWith('console/csp_violations', JSON.stringify([record]));
    expect(mockFireTelemetry).toHaveBeenCalledWith('CSPViolation', record);
  });
  it('correctly parses plugin name from sourceFile', () => {
    const testEventWithPlugin = new MockSecurityPolicyViolationEvent(
      'http://blocked.com',
      'http://localhost/api/plugins/foo',
    );
    const report = newCSPViolationReport('foo', testEventWithPlugin);
    const record = {
      ...report,
      timestamp: 999,
    };
    render(
      <Provider store={store}>
        <TestComponent />
      </Provider>,
    );
    mockNow.mockReturnValue(999);
    mockGetItem.mockReturnValue('');
    act(() => {
      fireEvent(document, testEventWithPlugin);
    });
    expect(mockSetItem).toHaveBeenCalledWith('console/csp_violations', JSON.stringify([record]));
    expect(mockFireTelemetry).toHaveBeenCalledWith('CSPViolation', record);
  });
});
