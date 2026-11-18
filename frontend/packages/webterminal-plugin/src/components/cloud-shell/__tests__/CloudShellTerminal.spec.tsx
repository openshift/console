import { render, screen } from '@testing-library/react';
import { useConsoleSelector } from '@console/shared/src/hooks/useConsoleSelector';
import { useFlag } from '@console/shared/src/hooks/useFlag';
import CloudShellTerminal from '../CloudShellTerminal';
import useCloudShellNamespace from '../useCloudShellNamespace';
import useCloudShellWorkspace from '../useCloudShellWorkspace';
import { user } from './cloud-shell-test-data';

jest.mock('../setup/CloudShellDeveloperSetup', () => ({
  default: () => 'developer-setup',
}));

jest.mock('../useCloudShellWorkspace', () => ({
  default: jest.fn(),
}));

jest.mock('../useCloudShellNamespace', () => ({
  default: jest.fn(),
}));

jest.mock('@console/internal/components/utils/rbac', () => ({
  useAccessReview2: () => [false, false],
}));

jest.mock('@console/shared/src/hooks/useUserPreference', () => ({
  useUserPreference: () => ['', () => {}, true],
}));

jest.mock('@console/shared/src/hooks/useConsoleSelector', () => ({
  useConsoleSelector: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useFlag', () => ({
  useFlag: jest.fn<boolean, []>(),
}));

const useFlagMock = useFlag as jest.Mock;
const useConsoleSelectorMock = useConsoleSelector as jest.Mock;

describe('CloudShellTerminal', () => {
  beforeEach(() => {
    useConsoleSelectorMock.mockReturnValue(user);
  });

  it('should display loading box', () => {
    useFlagMock.mockReturnValue(true);
    (useCloudShellWorkspace as jest.Mock).mockReturnValueOnce([null, false]);
    (useCloudShellNamespace as jest.Mock).mockReturnValueOnce(['sample-namespace', '']);
    render(<CloudShellTerminal />);
    expect(screen.getByTestId('loading-box')).toBeInTheDocument();
  });

  it('should display error statusBox', () => {
    useFlagMock.mockReturnValue(true);
    (useCloudShellWorkspace as jest.Mock).mockReturnValueOnce([null, false, true]);
    (useCloudShellNamespace as jest.Mock).mockReturnValueOnce(['sample-namespace', '']);
    render(<CloudShellTerminal />);
    expect(screen.getByTestId('console-empty-state')).toBeInTheDocument();
  });

  it('should display form if loaded and no workspace', () => {
    useFlagMock.mockReturnValue(true);
    (useCloudShellWorkspace as jest.Mock).mockReturnValue([[], true]);
    (useCloudShellNamespace as jest.Mock).mockReturnValue(['sample-namespace', '']);
    render(<CloudShellTerminal />);
    expect(screen.getByText('developer-setup')).toBeInTheDocument();
  });
});
