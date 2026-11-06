import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { StorageClassForm } from '../storage-class-form';

// Mount the form with the watches already loaded (e.g. a remount while the
// redux store still holds the data), so the initial render sees
// resources.sc.loaded: true.
jest.mock('../utils/k8s-watch-hook', () => ({
  useK8sWatchResources: jest.fn(() => ({
    sc: {
      data: [
        {
          apiVersion: 'storage.k8s.io/v1',
          kind: 'StorageClass',
          metadata: { name: 'standard' },
          provisioner: 'kubernetes.io/aws-ebs',
          parameters: {},
        },
      ],
      loaded: true,
      loadError: undefined,
    },
    csi: { data: [], loaded: true, loadError: undefined },
  })),
}));

jest.mock('@console/dynamic-plugin-sdk', () => ({
  ...jest.requireActual('@console/dynamic-plugin-sdk'),
  useResolvedExtensions: jest.fn(() => [[], true, undefined]),
}));

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: jest.fn(),
}));

describe('StorageClassForm mounted with loaded watch data', () => {
  it('keeps Create disabled initially and applies duplicate-name validation', async () => {
    const user = userEvent.setup();
    renderWithProviders(<StorageClassForm onClose={jest.fn()} />);

    const createButton = await screen.findByRole('button', { name: /create/i });
    expect(createButton).toBeDisabled();

    const nameInput = screen.getByLabelText('Name');
    await user.type(nameInput, 'standard');

    expect(await screen.findByText('Storage name must be unique')).toBeVisible();
    expect(createButton).toBeDisabled();
  });

  it('does not show the required-name error on a pristine form', async () => {
    // The initial validation on watch load must not flag the untouched
    // name field, matching the previous nameUpdated-gated behavior.
    renderWithProviders(<StorageClassForm onClose={jest.fn()} />);

    const createButton = await screen.findByRole('button', { name: /create/i });
    expect(createButton).toBeDisabled();
    expect(screen.queryByText('Storage name is required')).toBeNull();

    // Clearing a typed name still shows the error.
    const user = userEvent.setup();
    const nameInput = screen.getByLabelText('Name');
    await user.type(nameInput, 'a');
    await user.clear(nameInput);
    expect(await screen.findByText('Storage name is required')).toBeVisible();
  });
});
