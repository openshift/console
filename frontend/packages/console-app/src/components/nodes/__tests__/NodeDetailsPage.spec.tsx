// Assisted-by: Claude
import { render } from '@testing-library/react';
import { NodeModel } from '@console/internal/models';
import type { NodeKind } from '@console/internal/module/k8s';
import { NodeDetailsPage } from '../NodeDetailsPage';

jest.mock('@console/shared/src/hooks/useFlag', () => ({
  useFlag: jest.fn(() => false),
}));

jest.mock('@console/shared/src/selectors/node', () => ({
  isWindowsNode: jest.fn(() => false),
}));

jest.mock('@console/internal/components/factory', () => ({
  DetailsPage: jest.fn(() => null),
}));

jest.mock('../configuration/NodeConfiguration', () => ({
  NodeConfiguration: () => null,
}));

jest.mock('../health/NodeHealth', () => ({
  NodeHealth: () => null,
}));

jest.mock('../node-dashboard/NodeDashboard', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../NodeDetails', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../NodeLogs', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../NodeTerminal', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@console/internal/components/events', () => ({
  ResourceEventStream: () => null,
}));

jest.mock('@console/internal/components/pod-list', () => ({
  PodsPage: () => null,
}));

jest.mock('@console/internal/components/utils/horizontal-nav', () => ({
  navFactory: {
    editYaml: jest.fn(() => ({ href: 'yaml', nameKey: 'YAML' })),
    pods: jest.fn(() => ({ href: 'pods', nameKey: 'Pods' })),
    logs: jest.fn(() => ({ href: 'logs', nameKey: 'Logs' })),
    events: jest.fn(() => ({ href: 'events', nameKey: 'Events' })),
    terminal: jest.fn(() => ({ href: 'terminal', nameKey: 'Terminal' })),
  },
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

describe('NodeDetailsPage', () => {
  let useFlag: jest.Mock;
  let isWindowsNode: jest.Mock;
  let DetailsPage: jest.Mock;

  beforeEach(async () => {
    const flagModule = await import('@console/shared/src/hooks/useFlag');
    const nodeModule = await import('@console/shared/src/selectors/node');
    const factoryModule = await import('@console/internal/components/factory');

    useFlag = flagModule.useFlag as jest.Mock;
    isWindowsNode = nodeModule.isWindowsNode as jest.Mock;
    DetailsPage = factoryModule.DetailsPage as jest.Mock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should include health tab when FLAG_NODE_MGMT_V1 is enabled', () => {
    useFlag.mockReturnValue(true);
    isWindowsNode.mockReturnValue(false);

    render(<NodeDetailsPage kind={NodeModel.kind} />);

    const call = DetailsPage.mock.calls[0][0];
    const pages = call.pagesFor(mockNode);

    const healthTab = pages.find((page) => page.href === 'health');
    expect(healthTab).toBeDefined();
    expect(healthTab.nameKey).toBe('console-app~Health');
  });

  it('should not include health tab when FLAG_NODE_MGMT_V1 is disabled', () => {
    useFlag.mockReturnValue(false);
    isWindowsNode.mockReturnValue(false);

    render(<NodeDetailsPage kind={NodeModel.kind} />);

    const call = DetailsPage.mock.calls[0][0];
    const pages = call.pagesFor(mockNode);

    const healthTab = pages.find((page) => page.href === 'health');
    expect(healthTab).toBeUndefined();
  });

  it('should include terminal tab for non-Windows nodes', () => {
    useFlag.mockReturnValue(true);
    isWindowsNode.mockReturnValue(false);

    render(<NodeDetailsPage kind={NodeModel.kind} />);

    const call = DetailsPage.mock.calls[0][0];
    const pages = call.pagesFor(mockNode);

    const terminalTab = pages.find((page) => page.href === 'terminal');
    expect(terminalTab).toBeDefined();
  });

  it('should not include terminal tab for Windows nodes', () => {
    useFlag.mockReturnValue(true);
    isWindowsNode.mockReturnValue(true);

    render(<NodeDetailsPage kind={NodeModel.kind} />);

    const call = DetailsPage.mock.calls[0][0];
    const pages = call.pagesFor(mockNode);

    const terminalTab = pages.find((page) => page.href === 'terminal');
    expect(terminalTab).toBeUndefined();
  });

  it('should include configuration and workload tabs when FLAG_NODE_MGMT_V1 enabled', () => {
    useFlag.mockReturnValue(true);
    isWindowsNode.mockReturnValue(false);

    render(<NodeDetailsPage kind={NodeModel.kind} />);

    const call = DetailsPage.mock.calls[0][0];
    const pages = call.pagesFor(mockNode);

    const configTab = pages.find((page) => page.href === 'configuration');
    const healthTab = pages.find((page) => page.href === 'health');
    const eventsTab = pages.find((page) => page.href === 'events');
    const logsTab = pages.find((page) => page.href === 'logs');

    expect(configTab).toBeDefined();
    expect(healthTab).toBeDefined();

    expect(eventsTab).toBeUndefined();
    expect(logsTab).toBeUndefined();
  });

  it('should include events and logs tabs when FLAG_NODE_MGMT_V1 disabled', () => {
    useFlag.mockReturnValue(false);
    isWindowsNode.mockReturnValue(false);

    render(<NodeDetailsPage kind={NodeModel.kind} />);

    const call = DetailsPage.mock.calls[0][0];
    const pages = call.pagesFor(mockNode);

    const configTab = pages.find((page) => page.href === 'configuration');
    const healthTab = pages.find((page) => page.href === 'health');
    const eventsTab = pages.find((page) => page.href === 'events');
    const logsTab = pages.find((page) => page.href === 'logs');

    expect(eventsTab).toBeDefined();
    expect(logsTab).toBeDefined();

    expect(configTab).toBeUndefined();
    expect(healthTab).toBeUndefined();
  });

  it('should render DetailsPage component with correct props', () => {
    useFlag.mockReturnValue(true);
    isWindowsNode.mockReturnValue(false);

    render(<NodeDetailsPage kind={NodeModel.kind} />);

    expect(DetailsPage).toHaveBeenCalled();

    const call = DetailsPage.mock.calls[0][0];
    expect(typeof call.getResourceStatus).toBe('function');
    expect(typeof call.customActionMenu).toBe('function');
    expect(typeof call.pagesFor).toBe('function');
  });
});
