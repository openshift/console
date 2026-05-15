import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { PullSecret, ProjectLink } from '../namespace';
import * as k8sResourceModule from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource';
import { testNamespace } from '../../../__mocks__/k8sResourcesMocks';
import { ServiceAccountModel } from '../../models';

jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource', () => ({
  ...jest.requireActual('@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource'),
  k8sGet: jest.fn(),
}));

const mockSetActiveNamespace = jest.fn();
jest.mock('@console/shared/src/hooks/useActiveNamespace', () => ({
  ...jest.requireActual('@console/shared/src/hooks/useActiveNamespace'),
  useActiveNamespace: jest.fn(() => ['default', mockSetActiveNamespace]),
}));

const k8sGetMock = k8sResourceModule.k8sGet as jest.Mock;

describe('PullSecret', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('verifies loading state initially, then shows configuration button after data loads', async () => {
    k8sGetMock.mockResolvedValue({ imagePullSecrets: [] });

    renderWithProviders(<PullSecret namespace={testNamespace} />);

    expect(screen.getByRole('progressbar', { name: /contents/i })).toBeVisible();

    const button = await screen.findByRole('button', { name: /not configured/i });
    expect(button).toBeVisible();

    // Verify API was called correctly
    expect(k8sGetMock).toHaveBeenCalledWith(
      ServiceAccountModel,
      'default',
      testNamespace.metadata.name,
      {},
    );

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('handles service account loading and displays the pull secret management interface', async () => {
    k8sGetMock.mockResolvedValue({
      imagePullSecrets: [],
    });

    renderWithProviders(<PullSecret namespace={testNamespace} />);

    const button = await screen.findByRole('button', { name: 'Not configured' });
    expect(button).toBeVisible();
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
