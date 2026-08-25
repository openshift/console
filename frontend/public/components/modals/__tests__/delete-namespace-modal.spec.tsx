import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteNamespaceModal } from '../delete-namespace-modal';

const mockNavigate = jest.fn();

jest.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  Trans: () => <span />,
  withTranslation: () => (Component: React.ComponentType) => Component,
}));

jest.mock('@console/dynamic-plugin-sdk/src/lib-core', () => ({
  useOverlay: jest.fn(() => jest.fn()),
}));

jest.mock('@console/internal/module/k8s', () => ({
  k8sKill: jest.fn(() => Promise.resolve()),
}));

jest.mock('@console/shared/src/hooks/usePromiseHandler', () => ({
  usePromiseHandler: () => [(promise: Promise<unknown>) => promise, false, null],
}));

jest.mock('@console/shared/src/hooks/useConsoleDispatch', () => ({
  useConsoleDispatch: () => jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useConsoleSelector', () => ({
  useConsoleSelector: () => 'other-namespace',
}));

jest.mock('@console/shared/src/hooks/useUserPreference', () => ({
  useUserPreference: () => [null, jest.fn()],
}));

jest.mock('@console/shared/src/components/modals/ModalFooterWithAlerts', () => ({
  ModalFooterWithAlerts: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('../../../actions/ui', () => ({
  setActiveNamespace: jest.fn(),
  formatNamespaceRoute: jest.fn((ns, path) => path),
}));

const mockKind = {
  kind: 'Project',
  plural: 'projects',
  labelKey: 'Project',
};

const mockResource = {
  metadata: { name: 'test-sort-alpha' },
};

describe('DeleteNamespaceModal', () => {
  const closeOverlay = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('preserves URL search params (e.g. sort state) when navigating after delete', async () => {
    window.history.pushState({}, '', '/k8s/cluster/projects?sortBy=Requester&orderBy=asc');

    const user = userEvent.setup();
    render(
      <DeleteNamespaceModal
        kind={mockKind as never}
        resource={mockResource as never}
        closeOverlay={closeOverlay}
      />,
    );

    await user.type(screen.getByTestId('project-name-input'), 'test-sort-alpha');
    await user.click(screen.getByTestId('confirm-action'));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        '/k8s/cluster/projects?sortBy=Requester&orderBy=asc',
      );
    });
  });
});
