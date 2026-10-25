import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { PullSecret, ProjectLink } from '../namespace';
import { testNamespace } from './data/k8sResourcesMocks';

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

const mockSetActiveNamespace = jest.fn();
jest.mock('@console/shared/src/hooks/useActiveNamespace', () => ({
  ...jest.requireActual('@console/shared/src/hooks/useActiveNamespace'),
  useActiveNamespace: jest.fn(() => ['default', mockSetActiveNamespace]),
}));

jest.mock('@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay', () => ({
  useOverlay: jest.fn(),
}));

const useK8sWatchResourceMock = useK8sWatchResource as jest.Mock;
const launchModalMock = jest.fn();
const useOverlayMock = useOverlay as jest.Mock;

describe('PullSecret', () => {
  beforeEach(() => {
    useOverlayMock.mockReturnValue(launchModalMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading until the service account is available', () => {
    useK8sWatchResourceMock.mockReturnValue([undefined, false, undefined]);
    const { rerender } = renderWithProviders(<PullSecret namespace={testNamespace} />);

    expect(screen.getByRole('progressbar', { name: /contents/i })).toBeVisible();

    useK8sWatchResourceMock.mockReturnValue([{ imagePullSecrets: [] }, true, undefined]);
    rerender(<PullSecret namespace={testNamespace} />);

    expect(screen.getByRole('button', { name: 'Not configured' })).toBeVisible();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('opens configuration when the service account has no pull secrets', async () => {
    useK8sWatchResourceMock.mockReturnValue([{}, true, undefined]);
    const user = userEvent.setup();
    renderWithProviders(<PullSecret namespace={testNamespace} />);

    await user.click(screen.getByRole('button', { name: 'Not configured' }));

    expect(launchModalMock).toHaveBeenCalledTimes(1);
  });

  it('keeps displayed pull secrets in sync with service account updates', () => {
    useK8sWatchResourceMock.mockReturnValue([{}, true, undefined]);
    const { rerender } = renderWithProviders(
      <PullSecret namespace={testNamespace} canViewSecrets />,
    );

    expect(screen.getByRole('button', { name: 'Not configured' })).toBeVisible();

    useK8sWatchResourceMock.mockReturnValue([
      { imagePullSecrets: [{ name: 'registry-secret' }] },
      true,
      undefined,
    ]);
    rerender(<PullSecret namespace={testNamespace} canViewSecrets />);

    expect(screen.getByRole('link', { name: 'registry-secret' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Not configured' })).not.toBeInTheDocument();

    useK8sWatchResourceMock.mockReturnValue([{ imagePullSecrets: [] }, true, undefined]);
    rerender(<PullSecret namespace={testNamespace} canViewSecrets />);

    expect(screen.queryByRole('link', { name: 'registry-secret' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Not configured' })).toBeVisible();
  });

  it('shows an error when the service account watch fails', () => {
    useK8sWatchResourceMock.mockReturnValue([undefined, false, new Error('Forbidden')]);
    renderWithProviders(<PullSecret namespace={testNamespace} />);

    expect(screen.getByText('Error loading default pull Secrets')).toBeVisible();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Not configured' })).not.toBeInTheDocument();
  });
});

// Regression test: ProjectLink must update the active namespace via useActiveNamespace
// so that pages like API Explorer (which read activeNamespace from Redux) reflect the
// namespace selected on the Projects list page.
describe('ProjectLink', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls setActiveNamespace when a project link is clicked', async () => {
    const project = {
      metadata: { name: 'my-project', uid: 'test-uid' },
    };
    const user = userEvent.setup();

    renderWithProviders(<ProjectLink project={project} />);

    const link = screen.getByRole('link', { name: 'my-project' });
    await user.click(link);

    expect(mockSetActiveNamespace).toHaveBeenCalledWith('my-project');
  });

  it('does not call setActiveNamespace on modified click (Ctrl+Click)', async () => {
    const project = {
      metadata: { name: 'my-project', uid: 'test-uid' },
    };
    const user = userEvent.setup();

    renderWithProviders(<ProjectLink project={project} />);

    const link = screen.getByRole('link', { name: 'my-project' });
    await user.keyboard('{Control>}');
    await user.click(link);
    await user.keyboard('{/Control}');

    expect(mockSetActiveNamespace).not.toHaveBeenCalled();
  });
});
