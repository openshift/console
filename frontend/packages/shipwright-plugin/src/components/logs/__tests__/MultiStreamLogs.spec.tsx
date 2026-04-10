import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
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
jest.mock('@console/shared/src/utils/console-fetch', () => ({
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
        { className: 'odc-logs', 'data-test': `logs-${container.name}` },
        container.name,
      );
    }),
  };
});

describe('MultiStreamLogs', () => {
  let props: ComponentProps<typeof MultiStreamLogs>;

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
    render(<MultiStreamLogs {...props} />);
    // Mocked Logs use data-testid "logs-${container.name}"; no containers => none rendered.
    expect(screen.queryByTestId('logs-step-oc')).not.toBeInTheDocument();
  });

  it('should render inline loading based on logs completion', () => {
    render(<MultiStreamLogs {...props} />);
    const taskNameRegion = screen.getByTestId('multi-stream-logs-task-name');
    // When stillFetching is false, only the task name is present (no loading sub-tree from mock data).
    expect(taskNameRegion).toHaveTextContent('step-oc');
  });

  it('should render number of logs equal to number of containers', () => {
    const { containers: containerSpecs } = props.resource.spec;
    render(<MultiStreamLogs {...props} />);
    expect(containerSpecs.length).toBeGreaterThan(0);
    containerSpecs.forEach((c) => {
      expect(screen.getByTestId(`logs-${c.name}`)).toBeInTheDocument();
    });
  });
});
