import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { consoleFetchJSON } from '@console/dynamic-plugin-sdk/src/api/console-fetch';
import { LazyDeleteModalOverlay } from '@console/internal/components/modals';
import { DeleteModalOverlay } from '@console/internal/components/modals/delete-modal';
import { ClusterExtensionModel } from '@console/internal/models';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import {
  renderHookWithProviders,
  renderWithProviders,
} from '@console/shared/src/test-utils/unit-test-utils';
import type { ClusterExtensionKind } from '../../../types';
import { useClusterExtensionActionsProvider } from '../cluster-extension-actions-provider';

const WARNING_TITLE =
  'Deleting this ClusterExtension also deletes the objects it manages. This can include CustomResourceDefinitions.';
const WARNING_DATA_LOSS =
  'If a CustomResourceDefinition is deleted, every custom resource created from it is permanently deleted along with it. This includes resources created by you or your team. This data cannot be recovered, and reinstalling the extension will not restore it.';
const WARNING_CHECKBOX_GUIDANCE =
  'Leave the checkbox below checked to delete these managed objects. Clear it to leave them running on the cluster with no extension managing them, which means they will no longer be updated or removed automatically.';
const DEPENDENTS_CHECKBOX_LABEL = 'Delete dependent objects of this resource';

const mockLaunchModal = jest.fn();

jest.mock('@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay', () => ({
  useOverlay: () => mockLaunchModal,
}));

jest.mock('@console/shared/src/hooks/useK8sModel', () => ({
  useK8sModel: jest.fn(),
}));

jest.mock('@console/dynamic-plugin-sdk/src/api/console-fetch', () => {
  const consoleFetchJSONMock = Object.assign(jest.fn(), {
    delete: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
  });
  return {
    consoleFetch: jest.fn(),
    consoleFetchJSON: consoleFetchJSONMock,
    consoleFetchText: jest.fn(),
  };
});

const useK8sModelMock = useK8sModel as jest.Mock;
const deleteRequestMock = (consoleFetchJSON as unknown as { delete: jest.Mock }).delete;

const clusterExtension: ClusterExtensionKind = {
  apiVersion: 'olm.operatorframework.io/v1',
  kind: 'ClusterExtension',
  metadata: { name: 'test-extension' },
};

const renderProvider = () =>
  renderHookWithProviders(() => useClusterExtensionActionsProvider(clusterExtension));

/** Runs the real delete action and renders the shared modal it launches. */
const launchDeleteModal = () => {
  const { result } = renderProvider();
  const [actions] = result.current;
  const deleteAction = actions.find((action) => action.id === 'delete-resource');
  (deleteAction.cta as () => void)();

  expect(mockLaunchModal).toHaveBeenCalledWith(
    LazyDeleteModalOverlay,
    expect.objectContaining({ kind: ClusterExtensionModel, resource: clusterExtension }),
  );

  const [, modalProps] = mockLaunchModal.mock.calls[0];
  const closeOverlay = jest.fn();
  renderWithProviders(<DeleteModalOverlay {...modalProps} closeOverlay={closeOverlay} />);
  return { closeOverlay, user: userEvent.setup() };
};

const expectDeleteRequestWithPolicy = (propagationPolicy: string) =>
  expect(deleteRequestMock).toHaveBeenCalledWith(
    expect.stringContaining('/clusterextensions/test-extension'),
    { kind: 'DeleteOptions', apiVersion: 'v1', propagationPolicy },
    {},
    null,
  );

beforeEach(() => {
  jest.clearAllMocks();
  useK8sModelMock.mockReturnValue([ClusterExtensionModel, false]);
  deleteRequestMock.mockResolvedValue({});
});

describe('useClusterExtensionActionsProvider', () => {
  it('should return the standard resource actions in order', () => {
    const { result } = renderProvider();
    const [actions] = result.current;

    expect(actions.map((action) => action.id)).toEqual([
      'edit-labels',
      'edit-annotations',
      'edit-resource',
      'delete-resource',
    ]);
  });

  it('should return exactly one delete action', () => {
    const { result } = renderProvider();
    const [actions] = result.current;

    expect(actions.filter((action) => action.id === 'delete-resource')).toHaveLength(1);
  });

  it('should report loaded once the model resolves', () => {
    const { result } = renderProvider();

    expect(result.current[1]).toBe(true);
    expect(result.current[2]).toBeUndefined();
  });

  it('should report not loaded and offer no actions while the model lookup is in flight', () => {
    useK8sModelMock.mockReturnValue([undefined, true]);
    const { result } = renderProvider();

    expect(result.current[0]).toEqual([]);
    expect(result.current[1]).toBe(false);
    expect(result.current[2]).toBeUndefined();
  });
});

describe('ClusterExtension delete modal', () => {
  it('should render the cascading deletion warning above the confirmation question', () => {
    launchDeleteModal();

    const warning = screen.getByText(WARNING_TITLE);
    const confirmationQuestion = screen.getByText('test-extension');

    expect(warning).toBeVisible();
    expect(screen.getByText(WARNING_DATA_LOSS)).toBeVisible();
    expect(screen.getByText(WARNING_CHECKBOX_GUIDANCE)).toBeVisible();
    expect(warning.compareDocumentPosition(confirmationQuestion)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('should render the dependent objects checkbox checked by default', () => {
    launchDeleteModal();

    expect(screen.getByRole('checkbox', { name: DEPENDENTS_CHECKBOX_LABEL })).toBeChecked();
  });

  it('should send propagationPolicy Background when the checkbox is left checked', async () => {
    const { closeOverlay, user } = launchDeleteModal();

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(closeOverlay).toHaveBeenCalled());
    expectDeleteRequestWithPolicy('Background');
  });

  it('should send propagationPolicy Orphan when the checkbox is cleared', async () => {
    const { closeOverlay, user } = launchDeleteModal();

    await user.click(screen.getByRole('checkbox', { name: DEPENDENTS_CHECKBOX_LABEL }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(closeOverlay).toHaveBeenCalled());
    expectDeleteRequestWithPolicy('Orphan');
  });

  it('should keep the warning accurate once the checkbox is cleared', async () => {
    const { user } = launchDeleteModal();
    const checkbox = screen.getByRole('checkbox', { name: DEPENDENTS_CHECKBOX_LABEL });

    await user.click(checkbox);

    expect(checkbox).not.toBeChecked();
    expect(screen.getByText(WARNING_TITLE)).toBeVisible();
    expect(screen.getByText(WARNING_CHECKBOX_GUIDANCE)).toBeVisible();
  });

  it('should send no request when the deletion is cancelled', async () => {
    const { closeOverlay, user } = launchDeleteModal();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(deleteRequestMock).not.toHaveBeenCalled();
    expect(closeOverlay).toHaveBeenCalled();
  });

  it('should disable the delete button while the request is in flight', async () => {
    let resolveDelete: (value: unknown) => void;
    deleteRequestMock.mockReturnValue(
      new Promise((resolve) => {
        resolveDelete = resolve;
      }),
    );
    const { user } = launchDeleteModal();

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(screen.getByTestId('confirm-action')).toBeDisabled());

    await act(async () => {
      resolveDelete({});
    });
  });

  it('should surface the error and keep the modal open when the request fails', async () => {
    deleteRequestMock.mockRejectedValue(
      new Error('clusterextensions.olm.operatorframework.io is forbidden'),
    );
    const { closeOverlay, user } = launchDeleteModal();

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText(/is forbidden/)).toBeVisible();
    expect(closeOverlay).not.toHaveBeenCalled();
  });

  it('should close the modal when the deletion succeeds', async () => {
    const { closeOverlay, user } = launchDeleteModal();

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(closeOverlay).toHaveBeenCalled());
  });
});
