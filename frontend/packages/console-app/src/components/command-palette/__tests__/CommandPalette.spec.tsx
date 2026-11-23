import type { FC } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerPanelContent,
  Modal,
  ModalBody,
  TextInput,
} from '@patternfly/react-core';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Map as ImmutableMap } from 'immutable';
import { useLocation } from 'react-router';
import type {
  HrefNavItem,
  NavExtension,
  NavSection,
  ResourceClusterNavItem,
} from '@console/dynamic-plugin-sdk/src/extensions/navigation';
import type { Perspective } from '@console/dynamic-plugin-sdk/src/extensions/perspectives';
import useActivePerspective from '@console/dynamic-plugin-sdk/src/perspective/useActivePerspective';
import type { LoadedExtension } from '@console/dynamic-plugin-sdk/src/types';
import { useK8sWatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sWatchResource';
import { NamespaceBar } from '@console/internal/components/namespace-bar';
import { NodeModel } from '@console/internal/models';
import { useExtensions } from '@console/plugin-sdk/src/api/useExtensions';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import { usePerspectives } from '@console/shared/src/hooks/usePerspectives';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
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

jest.mock('@console/shared/src/hooks/useActiveNamespace', () => ({
  useActiveNamespace: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/usePerspectives', () => ({
  usePerspectives: jest.fn(),
}));

const WINDOWS_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

const perspective = (
  id: string,
  name: string,
  isDefault = false,
): LoadedExtension<Perspective> => ({
  type: 'console.perspective',
  properties: {
    id,
    name,
    icon: null,
    default: isDefault,
    landingPageURL: () => Promise.resolve(() => '/'),
    importRedirectURL: () => Promise.resolve(() => '/'),
  },
  uid: `perspective-${id}`,
  pluginName: 'test-plugin',
});

const loaded = <E extends NavExtension>(extension: E): LoadedExtension<NavExtension> => ({
  ...extension,
  uid: `uid-${extension.properties.id}`,
  pluginName: 'test-plugin',
});

const navExtensions = [
  loaded<NavSection>({
    type: 'console.navigation/section',
    properties: { id: 'home', name: 'Home' },
  }),
  loaded<HrefNavItem>({
    type: 'console.navigation/href',
    properties: { id: 'search', name: 'Search', section: 'home', href: '/search' },
  }),
  loaded<HrefNavItem>({
    type: 'console.navigation/href',
    properties: { id: 'events', name: 'Events', section: 'home', href: '/events' },
  }),
  loaded<HrefNavItem>({
    type: 'console.navigation/href',
    properties: { id: 'topology', name: 'Topology', perspective: 'dev', href: '/topology' },
  }),
];

const LocationDisplay: FC = () => {
  const location = useLocation();

  return <p data-test="location">{location.pathname}</p>;
};

const renderCommandPalette = () =>
  renderWithProviders(
    <>
      <CommandPalette />
      <div className="xterm">
        <textarea aria-label="Terminal input" />
      </div>
      <LocationDisplay />
    </>,
  );

const openWithShortcut = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.keyboard('{Control>}k{/Control}');

  return screen.findByRole('dialog', { name: 'Search' });
};

describe('CommandPalette', () => {
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
    (useActiveNamespace as jest.Mock).mockReturnValue(['default', jest.fn()]);
    (usePerspectives as jest.Mock).mockReturnValue([
      perspective('admin', 'Administrator', true),
      perspective('dev', 'Developer'),
    ]);
    (useExtensions as jest.Mock).mockReturnValue(navExtensions);
    (useK8sWatchResource as jest.Mock).mockReturnValue([
      [{ metadata: { name: 'kube-system' } }],
      true,
      null,
    ]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should mount the dialog while handling the shortcut key press', () => {
    renderCommandPalette();

    act(() => {
      document.body.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true, cancelable: true }),
      );
    });

    expect(screen.getByRole('dialog', { name: 'Search' })).toBeVisible();
  });

  it('should open with Ctrl+K and list the active perspective pages', async () => {
    const user = userEvent.setup();
    renderCommandPalette();

    await openWithShortcut(user);

    expect(
      screen.getByRole('combobox', { name: 'Search pages, resource types, and namespaces' }),
    ).toHaveFocus();
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'SearchHome',
      'EventsHome',
    ]);
  });

  it('should open from the masthead button', async () => {
    const user = userEvent.setup();
    renderCommandPalette();

    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(await screen.findByRole('dialog', { name: 'Search' })).toBeVisible();
  });

  it('should filter the results as the user types', async () => {
    const user = userEvent.setup();
    renderCommandPalette();
    await openWithShortcut(user);

    await user.keyboard('top');

    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'TopologyDeveloper perspective',
    ]);
  });

  it('should show a message when nothing matches', async () => {
    const user = userEvent.setup();
    renderCommandPalette();
    await openWithShortcut(user);

    await user.keyboard('zzz');

    expect(screen.getByText('No results found')).toBeVisible();
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('should move the active option with the arrow keys and wrap around', async () => {
    const user = userEvent.setup();
    renderCommandPalette();
    await openWithShortcut(user);
    const input = screen.getByRole('combobox');

    expect(input).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: /Search/ }).id,
    );

    await user.keyboard('{ArrowDown}');
    expect(input).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: /Events/ }).id,
    );

    await user.keyboard('{ArrowDown}');
    expect(input).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: /Search/ }).id,
    );

    await user.keyboard('{ArrowUp}');
    expect(input).toHaveAttribute(
      'aria-activedescendant',
      screen.getByRole('option', { name: /Events/ }).id,
    );
  });

  it('should go to the active page and close when the user presses Enter', async () => {
    const user = userEvent.setup();
    renderCommandPalette();
    await openWithShortcut(user);

    await user.keyboard('{ArrowDown}{Enter}');

    expect(screen.getByTestId('location')).toHaveTextContent('/events');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('should close when the user presses Escape', async () => {
    const user = userEvent.setup();
    renderCommandPalette();
    await openWithShortcut(user);

    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('should close when the user presses the shortcut again', async () => {
    const user = userEvent.setup();
    renderCommandPalette();
    await openWithShortcut(user);

    await user.keyboard('{Control>}k{/Control}');

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('should leave another open dialog and its draft alone when the user presses the shortcut', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <CommandPalette />
        <Modal isOpen variant="small" aria-label="Edit annotations">
          <ModalBody>
            <TextInput aria-label="Annotation value" />
          </ModalBody>
        </Modal>
      </>,
    );
    const draft = screen.getByRole('textbox', { name: 'Annotation value' });
    await user.type(draft, 'team=storage');

    await user.keyboard('{Control>}k{/Control}');

    expect(screen.queryByRole('dialog', { name: 'Search' })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Edit annotations' })).toBeVisible();
    expect(draft).toHaveValue('team=storage');
    expect(draft).toHaveFocus();
  });

  it('should open while a collapsed drawer keeps its hidden focus-trapped panel', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <CommandPalette />
        <Drawer isExpanded={false}>
          <DrawerContent
            panelContent={
              <DrawerPanelContent focusTrap={{ enabled: true }}>Details</DrawerPanelContent>
            }
          >
            Items
          </DrawerContent>
        </Drawer>
      </>,
    );

    await openWithShortcut(user);

    expect(screen.getByRole('dialog', { name: 'Search' })).toBeVisible();
  });

  it('should offer no namespaces while the namespace bar is disabled, and offer them again once it unmounts', async () => {
    const user = userEvent.setup();
    const { rerender } = renderWithProviders(
      <>
        <CommandPalette />
        <NamespaceBar isDisabled />
      </>,
    );
    await openWithShortcut(user);

    await user.keyboard('kube');

    expect(screen.getByText('No results found')).toBeVisible();

    rerender(
      <>
        <CommandPalette />
      </>,
    );

    expect(await screen.findByRole('heading', { name: 'Namespaces' })).toBeVisible();
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'kube-system',
    ]);
  });

  it('should list a resource type whose sidebar page sits in a hidden section', async () => {
    const user = userEvent.setup();
    (useExtensions as jest.Mock).mockReturnValue([
      ...navExtensions,
      loaded<ResourceClusterNavItem>({
        type: 'console.navigation/resource-cluster',
        properties: {
          id: 'nodes',
          section: 'compute',
          model: { group: 'core', version: 'v1', kind: 'Node' },
        },
      }),
    ]);
    renderWithProviders(<CommandPalette />, {
      initialState: {
        k8s: ImmutableMap({
          RESOURCES: ImmutableMap({ models: ImmutableMap({ Node: NodeModel }) }),
        }),
      },
    });
    await openWithShortcut(user);

    await user.keyboard('nodes');

    expect(screen.getByRole('heading', { name: 'Resource types' })).toBeVisible();
    expect(screen.getByRole('option', { name: /^Nodes/ })).toBeVisible();
  });

  it('should request the namespace list by group, version and kind', async () => {
    const user = userEvent.setup();
    renderCommandPalette();

    await openWithShortcut(user);

    expect(useK8sWatchResource).toHaveBeenCalledWith({
      groupVersionKind: { version: 'v1', kind: 'Namespace' },
      isList: true,
      optional: true,
    });
  });

  it('should stay closed when the shortcut is pressed inside the web terminal', async () => {
    const user = userEvent.setup();
    renderCommandPalette();
    await openWithShortcut(user);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    await user.click(screen.getByRole('textbox', { name: 'Terminal input' }));
    await user.keyboard('{Control>}k{/Control}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
