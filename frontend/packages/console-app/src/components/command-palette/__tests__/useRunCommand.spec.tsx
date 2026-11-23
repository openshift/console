import type { FC, ReactNode } from 'react';
import { lazy, Suspense, useCallback } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { BrowserRouter, useNavigate } from 'react-router';
import { combineReducers, createStore } from 'redux';
import type { Perspective } from '@console/dynamic-plugin-sdk/src/extensions/perspectives';
import useActivePerspective from '@console/dynamic-plugin-sdk/src/perspective/useActivePerspective';
import type { LoadedExtension } from '@console/dynamic-plugin-sdk/src/types';
import { useK8sWatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sWatchResource';
import { NamespaceBar } from '@console/internal/components/namespace-bar';
import { baseReducers } from '@console/internal/redux';
import { useExtensions } from '@console/plugin-sdk/src/api/useExtensions';
import { usePerspectives } from '@console/shared/src/hooks/usePerspectives';
import { NamespaceContext, useValuesForNamespaceContext } from '../../detect-context/namespace';
import { useLastNamespace } from '../../detect-context/useLastNamespace';
import { usePreferredNamespace } from '../../user-preferences/namespace/usePreferredNamespace';
import { CommandPalette } from '../CommandPalette';

jest.mock('@console/dynamic-plugin-sdk/src/perspective/useActivePerspective', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sWatchResource', () => ({
  useK8sWatchResource: jest.fn(),
}));

jest.mock('@console/plugin-sdk/src/api/useExtensions', () => ({
  useExtensions: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/usePerspectives', () => ({
  usePerspectives: jest.fn(),
}));

jest.mock('../../detect-context/useLastNamespace', () => ({
  useLastNamespace: jest.fn(),
}));

jest.mock('../../user-preferences/namespace/usePreferredNamespace', () => ({
  usePreferredNamespace: jest.fn(),
}));

const WINDOWS_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

const adminPerspective: LoadedExtension<Perspective> = {
  type: 'console.perspective',
  properties: {
    id: 'admin',
    name: 'Administrator',
    icon: null,
    default: true,
    landingPageURL: () => Promise.resolve(() => '/'),
    importRedirectURL: () => Promise.resolve(() => '/'),
  },
  uid: 'perspective-admin',
  pluginName: 'test-plugin',
};

const NamespaceProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { namespace, setNamespace } = useValuesForNamespaceContext();

  return (
    <NamespaceContext.Provider value={{ namespace, setNamespace }}>
      {children}
    </NamespaceContext.Provider>
  );
};

const renderAt = (url: string, page: ReactNode) => {
  window.history.replaceState(null, '', url);

  const store = createStore(combineReducers(baseReducers));

  const ui = (content: ReactNode) => (
    <Provider store={store}>
      <BrowserRouter>
        <NamespaceProvider>
          <CommandPalette />
          {content}
        </NamespaceProvider>
      </BrowserRouter>
    </Provider>
  );

  const { rerender } = render(ui(page));

  return { rerenderPage: (nextPage: ReactNode) => rerender(ui(nextPage)) };
};

const chooseNamespace = async (user: ReturnType<typeof userEvent.setup>, namespace: string) => {
  await user.keyboard('{Control>}k{/Control}');
  expect(await screen.findByRole('dialog', { name: 'Search' })).toBeVisible();
  await user.keyboard(namespace);
  await user.keyboard('{Enter}');
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
};

const NeverLoadingPage = lazy(() => new Promise<{ default: FC }>(() => {}));

const HelmReleasePage: FC = () => {
  const navigate = useNavigate();

  const onNamespaceChange = useCallback(
    (namespace: string) => navigate(`/helm-releases/ns/${namespace}`),
    [navigate],
  );

  return <NamespaceBar onNamespaceChange={onNamespaceChange} />;
};

describe('useRunCommand', () => {
  const { scrollIntoView } = Element.prototype;

  beforeAll(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  afterAll(() => {
    Element.prototype.scrollIntoView = scrollIntoView;
  });

  beforeEach(() => {
    jest.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(WINDOWS_USER_AGENT);
    (useActivePerspective as jest.Mock).mockReturnValue(['admin', jest.fn()]);
    (usePerspectives as jest.Mock).mockReturnValue([adminPerspective]);
    (useExtensions as jest.Mock).mockReturnValue([]);
    (useK8sWatchResource as jest.Mock).mockReturnValue([
      [{ metadata: { name: 'kube-system' } }, { metadata: { name: 'blue' } }],
      true,
      null,
    ]);
    (usePreferredNamespace as jest.Mock).mockReturnValue([undefined, jest.fn(), true]);
    (useLastNamespace as jest.Mock).mockReturnValue([undefined, jest.fn(), true]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    window.history.replaceState(null, '', '/');
  });

  it('should open the chosen namespace and drop the project-name query', async () => {
    const user = userEvent.setup();
    renderAt('/project-details/all-namespaces?project-name=kube', null);

    await chooseNamespace(user, 'kube-system');

    await waitFor(() => expect(window.location.pathname).toBe('/project-details/ns/kube-system'));
    expect(window.location.search).toBe('');
  });

  it('should let a page with its own namespace handler pick the page to open', async () => {
    const user = userEvent.setup();
    renderAt('/helm-releases/ns/red/release/demo', <HelmReleasePage />);

    await chooseNamespace(user, 'blue');

    await waitFor(() => expect(window.location.pathname).toBe('/helm-releases/ns/blue'));
  });

  it('should stop calling the handler of a namespace bar that has unmounted', async () => {
    const user = userEvent.setup();
    const onNamespaceChange = jest.fn();
    const { rerenderPage } = renderAt(
      '/k8s/ns/red/pods',
      <NamespaceBar onNamespaceChange={onNamespaceChange} />,
    );

    await chooseNamespace(user, 'blue');

    expect(onNamespaceChange).toHaveBeenCalledWith('blue');

    rerenderPage(null);
    await chooseNamespace(user, 'kube-system');

    expect(onNamespaceChange).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(window.location.pathname).toBe('/k8s/ns/kube-system/pods'));
  });

  it('should not call the handler of a namespace bar hidden while the next page loads', async () => {
    const user = userEvent.setup();
    const onNamespaceChange = jest.fn();
    const page = (isNextPageLoading: boolean) => (
      <Suspense fallback={<p>Loading next page</p>}>
        <NamespaceBar onNamespaceChange={onNamespaceChange} />
        {isNextPageLoading && <NeverLoadingPage />}
      </Suspense>
    );
    const { rerenderPage } = renderAt('/k8s/ns/red/pods', page(false));

    rerenderPage(page(true));
    expect(await screen.findByText('Loading next page')).toBeVisible();
    await chooseNamespace(user, 'blue');

    expect(onNamespaceChange).not.toHaveBeenCalled();
    await waitFor(() => expect(window.location.pathname).toBe('/k8s/ns/blue/pods'));
  });
});
