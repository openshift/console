import type { QuickStart } from '@patternfly/quickstarts';
import { render, waitFor } from '@testing-library/react';
import * as useQuickStartPermissionModule from '../../utils/useQuickStartPermission';
import { QuickStartPermissionChecker } from '../QuickStartPermissionChecker';

jest.mock('../../utils/useQuickStartPermission', () => ({
  useQuickStartPermission: jest.fn(),
}));

const mockUseQuickStartPermission = useQuickStartPermissionModule.useQuickStartPermission as jest.Mock;

describe('QuickStartPermissionChecker', () => {
  const createMockQuickStart = (name: string): QuickStart => ({
    apiVersion: 'console.openshift.io/v1',
    kind: 'QuickStart',
    metadata: {
      name,
    },
    spec: {
      displayName: `Test ${name}`,
      description: 'Test description',
      durationMinutes: 5,
      icon: null,
      introduction: 'Test intro',
      tasks: [],
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call onPermissionCheck when permission is loaded with true', async () => {
    mockUseQuickStartPermission.mockReturnValue([true, true]);

    const onPermissionCheck = jest.fn();
    const quickStart = createMockQuickStart('test-qs');

    render(
      <QuickStartPermissionChecker quickStart={quickStart} onPermissionCheck={onPermissionCheck} />,
    );

    // Component renders null; onPermissionCheck runs in useEffect after permission loads.
    await waitFor(() => {
      expect(onPermissionCheck).toHaveBeenCalledWith(quickStart, true);
    });
  });

  it('should call onPermissionCheck when permission is loaded with false', async () => {
    mockUseQuickStartPermission.mockReturnValue([false, true]);

    const onPermissionCheck = jest.fn();
    const quickStart = createMockQuickStart('test-qs');

    render(
      <QuickStartPermissionChecker quickStart={quickStart} onPermissionCheck={onPermissionCheck} />,
    );

    // Component renders null; onPermissionCheck runs in useEffect after permission loads.
    await waitFor(() => {
      expect(onPermissionCheck).toHaveBeenCalledWith(quickStart, false);
    });
  });

  it('should not call onPermissionCheck when permission is not loaded', () => {
    mockUseQuickStartPermission.mockReturnValue([false, false]);

    const onPermissionCheck = jest.fn();
    const quickStart = createMockQuickStart('test-qs');

    render(
      <QuickStartPermissionChecker quickStart={quickStart} onPermissionCheck={onPermissionCheck} />,
    );

    expect(onPermissionCheck).not.toHaveBeenCalled();
  });

  it('should pass quickStart to useQuickStartPermission', () => {
    mockUseQuickStartPermission.mockReturnValue([false, false]);

    const onPermissionCheck = jest.fn();
    const quickStart = createMockQuickStart('specific-qs');

    render(
      <QuickStartPermissionChecker quickStart={quickStart} onPermissionCheck={onPermissionCheck} />,
    );

    expect(mockUseQuickStartPermission).toHaveBeenCalledWith(quickStart);
  });
});
