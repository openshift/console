import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useTranslation } from 'react-i18next';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk';
import type { ClusterVersionKind } from '@console/internal/module/k8s';
import { useFlag } from '@console/shared/src/hooks/useFlag';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { UpdateWorkflowOLSButton } from '../explain-button';
import * as workflowUtils from '../workflow-utils';

// Mock all external dependencies
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useTelemetry', () => ({
  useTelemetry: jest.fn(),
}));

// Mock the flag hook to return true for OLS availability
jest.mock('@console/shared/src/hooks/useFlag', () => ({
  useFlag: jest.fn(),
}));

// Mock the dynamic plugin SDK hook
jest.mock('@console/dynamic-plugin-sdk', () => ({
  useResolvedExtensions: jest.fn(),
}));

jest.mock('../workflow-utils', () => ({
  generateUpdatePrompt: jest.fn(),
  getUpdateButtonText: jest.fn(),
}));

describe('UpdateWorkflowOLSButton', () => {
  const mockUseTranslation = useTranslation as jest.Mock;
  const mockUseTelemetry = useTelemetry as jest.Mock;
  const mockUseFlag = useFlag as jest.Mock;
  const mockUseResolvedExtensions = useResolvedExtensions as jest.Mock;
  const mockGenerateUpdatePrompt = workflowUtils.generateUpdatePrompt as jest.Mock;
  const mockGetUpdateButtonText = workflowUtils.getUpdateButtonText as jest.Mock;

  const mockT = jest.fn((key) => `translated-${key}`);
  const mockFireTelemetryEvent = jest.fn();
  const mockOpenOLS = jest.fn();

  const mockClusterVersion: ClusterVersionKind = {
    spec: {
      channel: 'stable-4.12',
      clusterID: 'test-cluster-id',
    },
    status: {
      desired: {
        version: '4.12.5',
      },
    },
  } as ClusterVersionKind;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock translation
    mockUseTranslation.mockReturnValue({ t: mockT });

    // Mock telemetry
    mockUseTelemetry.mockReturnValue(mockFireTelemetryEvent);

    // Mock feature flag - OLS is available
    mockUseFlag.mockReturnValue(true);

    // Mock dynamic plugin extension - OLS extension is available
    const mockExtension = {
      type: 'console.action/provider',
      properties: {
        contextId: 'ols-open-handler',
        provider: () => mockOpenOLS,
      },
    };
    mockUseResolvedExtensions.mockReturnValue([
      [mockExtension], // extensions array
      true, // resolved flag
    ]);

    // Mock workflow utils
    mockGenerateUpdatePrompt.mockReturnValue('Generated prompt');
    mockGetUpdateButtonText.mockReturnValue('Get Help');
  });

  describe('rendering', () => {
    it('should render OLS button with correct props for status phase', () => {
      renderWithProviders(
        <UpdateWorkflowOLSButton phase="status" cv={mockClusterVersion} className="custom-class" />,
      );

      const button = screen.getByRole('button');
      expect(button).toBeVisible();
      expect(button).toHaveAttribute('data-test', 'ols-update-status');
      expect(button).toHaveClass('custom-class');
      expect(button).toHaveTextContent('Get Help');
    });

    it('should render with different data-test attribute for different phases', () => {
      renderWithProviders(<UpdateWorkflowOLSButton phase="pre-check" cv={mockClusterVersion} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('data-test', 'ols-update-pre-check');
    });

    it('should not render when OLS flag is disabled', () => {
      mockUseFlag.mockReturnValue(false);

      renderWithProviders(<UpdateWorkflowOLSButton phase="status" cv={mockClusterVersion} />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should not render when OLS extension is not available', () => {
      mockUseResolvedExtensions.mockReturnValue([[], false]);

      renderWithProviders(<UpdateWorkflowOLSButton phase="status" cv={mockClusterVersion} />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('workflow integration', () => {
    it('should call workflow utilities on button click', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UpdateWorkflowOLSButton phase="status" cv={mockClusterVersion} />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(mockGenerateUpdatePrompt).toHaveBeenCalledWith(
        'status',
        mockClusterVersion,
        mockT,
        undefined, // clusterOperators
        undefined, // machineConfigPools (optional)
        undefined, // alerts (optional)
        undefined, // targetVersion (optional)
      );
    });

    it('should call openOLS with correct parameters on button click - no attachments (MCP uses tools)', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UpdateWorkflowOLSButton phase="status" cv={mockClusterVersion} />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(mockOpenOLS).toHaveBeenCalledWith(
        'Generated prompt',
        [], // Empty attachments - MCP tools fetch real-time cluster data
        true,
        true,
      );
    });

    it('should get button text from workflow utilities', () => {
      renderWithProviders(<UpdateWorkflowOLSButton phase="status" cv={mockClusterVersion} />);

      expect(mockGetUpdateButtonText).toHaveBeenCalledWith('status', mockT);
    });
  });

  describe('telemetry tracking', () => {
    it('should fire telemetry event when button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UpdateWorkflowOLSButton phase="status" cv={mockClusterVersion} />);

      await user.click(screen.getByRole('button'));

      expect(mockFireTelemetryEvent).toHaveBeenCalledWith('OLS Update Workflow Button Clicked', {
        source: 'cluster-settings',
        workflowPhase: 'status',
        clusterVersion: '4.12.5',
        updateChannel: 'stable-4.12',
        clusterId: 'test-cluster-id',
      });
    });

    it('should handle missing version data in telemetry', async () => {
      const user = userEvent.setup();
      const cvWithoutVersion: ClusterVersionKind = {
        spec: {
          channel: 'stable-4.12',
          clusterID: 'test-cluster-id',
        },
        status: {},
      } as ClusterVersionKind;

      renderWithProviders(<UpdateWorkflowOLSButton phase="status" cv={cvWithoutVersion} />);

      await user.click(screen.getByRole('button'));

      expect(mockFireTelemetryEvent).toHaveBeenCalledWith('OLS Update Workflow Button Clicked', {
        source: 'cluster-settings',
        workflowPhase: 'status',
        clusterVersion: 'unknown',
        updateChannel: 'stable-4.12',
        clusterId: 'test-cluster-id',
      });
    });
  });

  describe('workflow phases and props', () => {
    it('should handle different workflow phases correctly', () => {
      const phases = ['status', 'pre-check'] as const;

      phases.forEach((phase) => {
        mockGetUpdateButtonText.mockReturnValue(`Get ${phase} Help`);

        const { unmount } = renderWithProviders(
          <UpdateWorkflowOLSButton phase={phase} cv={mockClusterVersion} />,
        );

        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('data-test', `ols-update-${phase}`);
        expect(button).toHaveTextContent(`Get ${phase} Help`);

        unmount();
        jest.clearAllMocks();
        // Reset mocks for next iteration
        mockUseTranslation.mockReturnValue({ t: mockT });
        mockUseTelemetry.mockReturnValue(mockFireTelemetryEvent);
        mockUseFlag.mockReturnValue(true);
        mockUseResolvedExtensions.mockReturnValue([
          [
            {
              type: 'console.action/provider',
              properties: { contextId: 'ols-open-handler', provider: () => mockOpenOLS },
            },
          ],
          true,
        ]);
        mockGenerateUpdatePrompt.mockReturnValue('Generated prompt');
      });
    });

    it('should render without optional className when not provided', () => {
      renderWithProviders(<UpdateWorkflowOLSButton phase="status" cv={mockClusterVersion} />);

      const button = screen.getByRole('button');
      expect(button).toBeVisible();
      expect(button).toHaveAttribute('data-test', 'ols-update-status');
    });
  });

  describe('onClick callback', () => {
    it('should call onClick callback when provided', async () => {
      const user = userEvent.setup();
      const mockOnClick = jest.fn();

      renderWithProviders(
        <UpdateWorkflowOLSButton phase="status" cv={mockClusterVersion} onClick={mockOnClick} />,
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should not error when onClick callback is not provided', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UpdateWorkflowOLSButton phase="status" cv={mockClusterVersion} />);

      const button = screen.getByRole('button');

      await expect(user.click(button)).resolves.not.toThrow();
    });
  });
});
