// Assisted-by: Claude
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { NodeKind } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import NodePerformance from '../NodePerformance';

jest.mock('@console/internal/components/utils', () => ({
  SectionHeading: ({ text }) => <h2>{text}</h2>,
}));

jest.mock('@console/shared/src/components/layout/PaneBody', () => ({
  __esModule: true,
  default: ({ children }) => <div data-test="pane-body">{children}</div>,
}));

jest.mock('@console/shared/src/components/query-browser/QueryBrowser', () => ({
  QueryBrowser: jest.fn(({ queries }) => <div data-test="query-browser">{queries.join(', ')}</div>),
}));

const mockNode: NodeKind = {
  apiVersion: 'v1',
  kind: 'Node',
  metadata: {
    name: 'test-node',
    uid: 'test-node-uid',
  },
  spec: {},
  status: {
    conditions: [],
  },
};

describe('NodePerformance', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render the Performance heading', () => {
    render(<NodePerformance obj={mockNode} />);

    expect(screen.getByRole('heading', { name: 'Performance' })).toBeVisible();
  });

  it('should render all four performance sections', () => {
    render(<NodePerformance obj={mockNode} />);

    expect(screen.getByText('CPU')).toBeVisible();
    expect(screen.getByText('Memory')).toBeVisible();
    expect(screen.getByText('Network')).toBeVisible();
    expect(screen.getByText('Disk IO')).toBeVisible();
  });

  it('should render CPU section charts by default', () => {
    render(<NodePerformance obj={mockNode} />);

    expect(screen.getByText('CPU Utilization')).toBeVisible();
    expect(screen.getByText('CPU Saturation (Load per CPU)')).toBeVisible();
  });

  it('should render Memory section charts by default', () => {
    render(<NodePerformance obj={mockNode} />);

    expect(screen.getByText('Memory Utilization')).toBeVisible();
    expect(screen.getByText('Memory Saturation (Major Page Faults)')).toBeVisible();
  });

  it('should render Network section charts by default', () => {
    render(<NodePerformance obj={mockNode} />);

    expect(screen.getByText('Network Utilization (Bytes Received/Transmitted)')).toBeVisible();
    expect(screen.getByText('Network Saturation (Drops Received/Transmitted)')).toBeVisible();
  });

  it('should render Disk IO section charts by default', () => {
    render(<NodePerformance obj={mockNode} />);

    expect(screen.getByText('Disk IO Utilization')).toBeVisible();
    expect(screen.getByText('Disk IO Saturation')).toBeVisible();
  });

  it('should collapse section when toggle is clicked', async () => {
    const user = userEvent.setup();
    render(<NodePerformance obj={mockNode} />);

    const cpuToggle = screen.getByRole('button', { name: 'CPU' });
    expect(screen.getByText('CPU Utilization')).toBeVisible();

    await user.click(cpuToggle);

    expect(screen.queryByText('CPU Utilization')).not.toBeInTheDocument();
  });

  it('should expand section when toggle is clicked again', async () => {
    const user = userEvent.setup();
    render(<NodePerformance obj={mockNode} />);

    const memoryToggle = screen.getByRole('button', { name: 'Memory' });

    await user.click(memoryToggle);
    expect(screen.queryByText('Memory Utilization')).not.toBeInTheDocument();

    await user.click(memoryToggle);
    expect(screen.getByText('Memory Utilization')).toBeVisible();
  });

  it('should include node name in Prometheus queries', () => {
    render(<NodePerformance obj={mockNode} />);

    const queryBrowsers = screen.getAllByTestId('query-browser');
    expect(queryBrowsers.length).toBeGreaterThan(0);

    const firstQuery = queryBrowsers[0].textContent;
    expect(firstQuery).toContain('test-node');
  });
});
