import { screen, act } from '@testing-library/react';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { useProjectOrNamespaceModel } from '@console/internal/components/utils/list-dropdown';
import { NamespaceModel } from '@console/internal/models';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import NamespaceDropdown from '../NamespaceDropdown';
import { usePreferredNamespace } from '../usePreferredNamespace';
import { mockNamespaces } from './namespace.data';

jest.mock('@console/internal/components/utils/list-dropdown', () => ({
  useProjectOrNamespaceModel: jest.fn(),
}));

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

jest.mock('../usePreferredNamespace', () => ({
  usePreferredNamespace: jest.fn(),
}));

jest.mock('fuzzysearch', () => {
  return { default: jest.fn() };
});

jest.mock('@console/shared/src/hooks/useTelemetry', () => ({
  useTelemetry: () => {},
}));

const mockProjectOrNamespaceModel = useProjectOrNamespaceModel as jest.Mock;
const mockK8sWatchResource = useK8sWatchResource as jest.Mock;
const mockUsePreferredNamespace = usePreferredNamespace as jest.Mock;

describe('NamespaceDropdown', () => {
  const preferredNamespace: string = mockNamespaces[1].metadata.name;

  const setupMocks = (preferredNs?: string, loaded = true) => {
    mockProjectOrNamespaceModel.mockReturnValue([NamespaceModel, true]);
    mockK8sWatchResource.mockReturnValue([mockNamespaces, true, false]);
    mockUsePreferredNamespace.mockReturnValue([preferredNs, jest.fn(), loaded]);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading state while namespace preferences are being fetched', async () => {
    setupMocks('', false);

    await act(async () => {
      renderWithProviders(<NamespaceDropdown />);
    });

    expect(screen.getByTestId('dropdown skeleton console.preferredNamespace')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should display selected namespace name when preference is set', async () => {
    setupMocks(preferredNamespace, true);

    await act(async () => {
      renderWithProviders(<NamespaceDropdown />);
    });

    expect(screen.getByRole('button', { name: preferredNamespace })).toBeVisible();
  });

  it('should show "Last viewed" option when no preference is set', async () => {
    setupMocks(undefined, true);

    await act(async () => {
      renderWithProviders(<NamespaceDropdown />);
    });

    expect(screen.getByRole('button', { name: 'Last viewed' })).toBeVisible();
  });
});
