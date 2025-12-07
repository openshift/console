import * as React from 'react';
import { render } from '@testing-library/react';
import { cloneDeep } from 'lodash';
import { MultiStreamLogs } from '../MultiStreamLogs';
import { podData } from './logs-test-data';

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

// Mock useScrollDirection
jest.mock('@console/shared', () => ({
  useScrollDirection: jest.fn(() => [null, jest.fn()]),
  ScrollDirection: {
    scrolledToBottom: 'scrolledToBottom',
    scrolledToTop: 'scrolledToTop',
    scrollingDown: 'scrollingDown',
    scrollingUp: 'scrollingUp',
  },
}));

// Mock coFetchText
jest.mock('@console/internal/co-fetch', () => ({
  coFetchText: jest.fn(() => Promise.resolve('')),
}));

// Mock resourceURL and modelFor
jest.mock('@console/internal/module/k8s', () => ({
  resourceURL: jest.fn(() => '/api/test-url'),
  modelFor: jest.fn(() => ({})),
  PodKind: {},
  ContainerSpec: {},
}));

// Mock WSFactory
jest.mock('@console/internal/module/ws-factory', () => ({
  WSFactory: jest.fn().mockImplementation(() => ({
    onmessage: jest.fn().mockReturnThis(),
    onclose: jest.fn().mockReturnThis(),
    onerror: jest.fn().mockReturnThis(),
    destroy: jest.fn(),
  })),
}));

// Mock Logs component to avoid complex dependencies
jest.mock('../Logs', () => {
  const ReactMock = (jest as any).requireActual('react');
  return {
    __esModule: true,
    default: jest.fn(({ container }: { container: { name: string } }) => {
      return ReactMock.createElement(
        'div',
        { className: 'odc-logs', 'data-testid': `logs-${container.name}` },
        container.name,
      );
    }),
  };
});

describe('MultiStreamLogs', () => {
  let props: React.ComponentProps<typeof MultiStreamLogs>;

  beforeEach(() => {
    jest.clearAllMocks();
    props = {
      taskName: 'step-oc',
      resource: cloneDeep(podData),
      setCurrentLogsGetter: jest.fn(),
    };
  });

  it('should not render logs when containers is not present', () => {
    props.resource.spec.containers = [];
    const { container } = render(<MultiStreamLogs {...props} />);
    const logsElements = container.querySelectorAll('.odc-logs');
    expect(logsElements.length).toBe(0);
  });

  it('should render inline loading based on logs completion', () => {
    const { container } = render(<MultiStreamLogs {...props} />);
    const taskNameElement = container.querySelector('[data-test-id="logs-taskName"]');
    expect(taskNameElement).not.toBeNull();
    expect(taskNameElement?.textContent).toBe('step-oc');
    expect(
      taskNameElement?.querySelector('.odc-multi-stream-logs__taskName__loading-indicator'),
    ).toBeNull();
  });

  it('should render number of logs equal to number of containers', () => {
    const containersLength = props.resource.spec.containers.length;
    const { container } = render(<MultiStreamLogs {...props} />);
    const logsElements = container.querySelectorAll('.odc-logs');
    expect(logsElements.length).toBe(containersLength);
  });
});
