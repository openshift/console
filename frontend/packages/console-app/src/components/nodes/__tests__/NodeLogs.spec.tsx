// Assisted-by: Claude
import { render, screen, waitFor } from '@testing-library/react';
import type { NodeKind } from '@console/internal/module/k8s';
import NodeLogs from '../NodeLogs';

jest.mock('@patternfly/react-log-viewer', () => ({
  LogViewer: () => <div data-test="log-viewer">Log Viewer</div>,
  LogViewerSearch: () => <div data-test="log-viewer-search">Search</div>,
}));

jest.mock('@console/dynamic-plugin-sdk/src/utils/flags', () => ({
  useFlag: jest.fn(() => false),
}));

jest.mock('@console/internal/components/ThemeProvider', () => ({
  useTheme: jest.fn(() => ({ isDark: false })),
}));

jest.mock('@console/internal/components/utils', () => ({
  SectionHeading: ({ text }) => <h2 data-test="section-heading">{text}</h2>,
}));

jest.mock('@console/internal/components/utils/status-box', () => ({
  LoadingBox: () => <div data-test="loading-box">Loading...</div>,
  LoadingInline: () => <span data-test="loading-inline">Loading...</span>,
}));

jest.mock('@console/shared/src/components/layout/PaneBody', () => ({
  __esModule: true,
  default: ({ children }) => <div data-test="pane-body">{children}</div>,
}));

jest.mock('@console/shared/src/hooks/useQueryParamsMutator', () => ({
  useQueryParamsMutator: jest.fn(() => ({
    getQueryArgument: jest.fn(() => null),
    setQueryArgument: jest.fn(),
    removeQueryArgument: jest.fn(),
  })),
}));

jest.mock('@console/shared/src/hooks/useUserPreference', () => ({
  useUserPreference: jest.fn(() => [false, jest.fn()]),
}));

jest.mock('@console/shared/src/utils/console-fetch', () => ({
  coFetch: jest.fn(() => Promise.resolve({ text: () => Promise.resolve('') })),
}));

jest.mock('../NodeLogsUnitFilter', () => ({
  __esModule: true,
  default: () => <div data-test="unit-filter">Unit Filter</div>,
}));

const mockNode: NodeKind = {
  apiVersion: 'v1',
  kind: 'Node',
  metadata: {
    name: 'test-node',
    uid: 'test-node-uid',
    labels: {},
  },
  spec: {},
  status: {
    conditions: [],
    nodeInfo: {
      operatingSystem: 'linux',
      architecture: '',
    },
  },
};

describe('NodeLogs', () => {
  let useFlag: jest.Mock;

  beforeEach(async () => {
    const flagModule = await import('@console/dynamic-plugin-sdk/src/utils/flags');
    useFlag = flagModule.useFlag as jest.Mock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render SectionHeading when FLAG_OPENSHIFT_5 is enabled', async () => {
    useFlag.mockReturnValue(true);

    render(<NodeLogs obj={mockNode} />);

    await waitFor(() => {
      const heading = screen.getByTestId('section-heading');
      expect(heading).toBeInTheDocument();
    });
    const heading = screen.getByTestId('section-heading');
    expect(heading).toHaveTextContent('Logs');
  });

  it('should not render SectionHeading when FLAG_OPENSHIFT_5 is disabled', async () => {
    useFlag.mockReturnValue(false);

    render(<NodeLogs obj={mockNode} />);

    await waitFor(() => {
      const heading = screen.queryByTestId('section-heading');
      expect(heading).not.toBeInTheDocument();
    });
  });

  it('should render PaneBody component', async () => {
    useFlag.mockReturnValue(false);

    render(<NodeLogs obj={mockNode} />);

    await waitFor(() => {
      expect(screen.getByTestId('pane-body')).toBeInTheDocument();
    });
  });

  it('should render log path selector', async () => {
    useFlag.mockReturnValue(false);

    render(<NodeLogs obj={mockNode} />);

    await waitFor(() => {
      const pathSelector = screen.getByTestId('select-path');
      expect(pathSelector).toBeInTheDocument();
    });
  });

  it('should render log viewer component', async () => {
    useFlag.mockReturnValue(false);

    render(<NodeLogs obj={mockNode} />);

    await waitFor(() => {
      const logViewer = screen.getByTestId('log-viewer');
      expect(logViewer).toBeInTheDocument();
    });
  });
});
