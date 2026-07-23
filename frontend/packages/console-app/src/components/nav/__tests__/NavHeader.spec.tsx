import { TestPluginStore } from '@openshift/dynamic-plugin-sdk';
import { screen, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import type { Perspective } from '@console/shared/src/utils/override-perspectives';
import { PerspectiveVisibilityState } from '@console/shared/src/utils/override-perspectives';
import {
  createLocalPluginManifest,
  createRemotePluginManifest,
  addLoadedPluginFromManifest,
} from '../../console-operator/__tests__/pluginTestUtils';
import NavHeader from '../NavHeader';
import { renderWithPerspective } from './navTestUtils';

let mockOverridePerspectives: Perspective[];

jest.mock('@console/shared/src/utils/override-perspectives', () => ({
  ...jest.requireActual('@console/shared/src/utils/override-perspectives'),
  get overridePerspectives() {
    return mockOverridePerspectives;
  },
}));

jest.mock('@console/internal/components/utils/async', () => ({
  AsyncComponent: () => null,
}));

// Minimal PluginStore test impl. containing Console perspective extensions.
// TODO: replace with `new TestPluginStore(actualPluginStore)` once supported
const createPluginStoreWithPerspectiveExtensions = () => {
  const pluginStore = new TestPluginStore({
    loaderOptions: { entryCallbackSettings: { registerCallback: false } },
  });

  addLoadedPluginFromManifest(pluginStore, createLocalPluginManifest('@console/app'), [
    {
      type: 'console.perspective',
      properties: { id: 'admin', default: true, name: 'Core platform' },
    },
  ]);

  addLoadedPluginFromManifest(pluginStore, createLocalPluginManifest('@console/dev-console'), [
    {
      type: 'console.perspective',
      properties: { id: 'dev', name: 'Developer' },
    },
  ]);

  return pluginStore;
};

describe('NavHeader', () => {
  const mockOnPerspectiveSelected = jest.fn();
  let mockSetActivePerspective: jest.Mock;
  let pluginStore: TestPluginStore;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetActivePerspective = jest.fn();
    pluginStore = createPluginStoreWithPerspectiveExtensions();
  });

  describe('when multiple perspectives are available', () => {
    it('should render perspective switcher dropdown with toggle button', () => {
      renderWithProviders(<NavHeader onPerspectiveSelected={mockOnPerspectiveSelected} />, {
        pluginStore,
      });

      const toggle = screen.getByRole('button', { expanded: false });
      expect(toggle).toBeVisible();
      expect(screen.getByRole('heading', { name: 'Core platform' })).toBeVisible();
    });

    it('should open dropdown menu when toggle is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<NavHeader onPerspectiveSelected={mockOnPerspectiveSelected} />, {
        pluginStore,
      });

      const toggle = screen.getByRole('button', { expanded: false });
      await user.click(toggle);

      expect(await screen.findByRole('button', { expanded: true })).toBeVisible();
    });

    it('should display all perspective options in dropdown menu', async () => {
      const user = userEvent.setup();
      renderWithProviders(<NavHeader onPerspectiveSelected={mockOnPerspectiveSelected} />, {
        pluginStore,
      });

      await user.click(screen.getByRole('button'));

      expect(await screen.findByRole('listbox')).toBeVisible();
      expect(screen.getAllByRole('option')).toHaveLength(2);
    });

    it('should switch perspective when an option is selected', async () => {
      const user = userEvent.setup();
      renderWithPerspective(
        <NavHeader onPerspectiveSelected={mockOnPerspectiveSelected} />,
        'admin',
        mockSetActivePerspective,
        { pluginStore },
      );

      await user.click(screen.getByRole('button'));

      expect(await screen.findByRole('button', { expanded: true })).toBeVisible();

      const devOption = screen.getByRole('heading', { name: 'Developer' });
      await user.click(devOption);

      expect(mockSetActivePerspective).toHaveBeenCalledWith('dev');
      expect(mockOnPerspectiveSelected).toHaveBeenCalled();
    });

    it('should close dropdown after selecting a perspective', async () => {
      const user = userEvent.setup();
      renderWithPerspective(
        <NavHeader onPerspectiveSelected={mockOnPerspectiveSelected} />,
        'admin',
        mockSetActivePerspective,
        { pluginStore },
      );

      await user.click(screen.getByRole('button'));

      const listbox = await screen.findByRole('listbox');
      expect(listbox).toBeVisible();

      const options = screen.getAllByRole('option');
      await user.click(options[0]);

      await waitForElementToBeRemoved(listbox);
    });
  });

  describe('when only admin perspective is available', () => {
    beforeEach(() => {
      mockOverridePerspectives = [
        { id: 'admin', visibility: { state: PerspectiveVisibilityState.Enabled } },
        { id: 'dev', visibility: { state: PerspectiveVisibilityState.Disabled } },
      ];
    });

    afterEach(() => {
      mockOverridePerspectives = undefined;
    });

    it('should render static label instead of a dropdown', () => {
      renderWithProviders(<NavHeader onPerspectiveSelected={mockOnPerspectiveSelected} />, {
        pluginStore,
      });

      expect(screen.getByRole('heading', { name: 'Core platform' })).toBeVisible();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('when both admin and dev perspectives are unavailable', () => {
    beforeEach(() => {
      mockOverridePerspectives = [
        { id: 'admin', visibility: { state: PerspectiveVisibilityState.Disabled } },
        { id: 'dev', visibility: { state: PerspectiveVisibilityState.Disabled } },
      ];
    });

    afterEach(() => {
      mockOverridePerspectives = undefined;
    });

    it('active perspective "admin", no remote plugins: render admin perspective label', () => {
      renderWithPerspective(
        <NavHeader onPerspectiveSelected={mockOnPerspectiveSelected} />,
        'admin',
        mockSetActivePerspective,
        { pluginStore },
      );

      expect(screen.getByRole('heading', { name: 'Core platform' })).toBeVisible();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('perspective-progress-icon')).not.toBeInTheDocument();
    });

    it('active perspective "admin", remote plugins pending: render in-progress icon', () => {
      pluginStore.addPendingPlugin(createRemotePluginManifest('test-plugin'));

      renderWithPerspective(
        <NavHeader onPerspectiveSelected={mockOnPerspectiveSelected} />,
        'admin',
        mockSetActivePerspective,
        { pluginStore },
      );

      expect(screen.queryByRole('heading', { name: 'Core platform' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(screen.getByTestId('perspective-progress-icon')).toBeVisible();
    });

    it('active perspective "admin", remote plugins loaded: render test perspective label', () => {
      addLoadedPluginFromManifest(pluginStore, createRemotePluginManifest('test-plugin'), [
        {
          type: 'console.perspective',
          properties: { id: 'test', name: 'Test perspective name' },
        },
      ]);

      renderWithPerspective(
        <NavHeader onPerspectiveSelected={mockOnPerspectiveSelected} />,
        'admin',
        mockSetActivePerspective,
        { pluginStore },
      );

      expect(screen.getByRole('heading', { name: 'Test perspective name' })).toBeVisible();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('perspective-progress-icon')).not.toBeInTheDocument();
    });

    it('active perspective "test", no remote plugins: render admin perspective label', () => {
      renderWithPerspective(
        <NavHeader onPerspectiveSelected={mockOnPerspectiveSelected} />,
        'test',
        mockSetActivePerspective,
        { pluginStore },
      );

      expect(screen.getByRole('heading', { name: 'Core platform' })).toBeVisible();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('perspective-progress-icon')).not.toBeInTheDocument();
    });

    it('active perspective "test", remote plugins pending: render admin perspective label', () => {
      pluginStore.addPendingPlugin(createRemotePluginManifest('test-plugin'));

      renderWithPerspective(
        <NavHeader onPerspectiveSelected={mockOnPerspectiveSelected} />,
        'test',
        mockSetActivePerspective,
        { pluginStore },
      );

      expect(screen.getByRole('heading', { name: 'Core platform' })).toBeVisible();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('perspective-progress-icon')).not.toBeInTheDocument();
    });

    it('active perspective "test", remote plugins loaded: render test perspective label', () => {
      addLoadedPluginFromManifest(pluginStore, createRemotePluginManifest('test-plugin'), [
        {
          type: 'console.perspective',
          properties: { id: 'test', name: 'Test perspective name' },
        },
      ]);

      renderWithPerspective(
        <NavHeader onPerspectiveSelected={mockOnPerspectiveSelected} />,
        'test',
        mockSetActivePerspective,
        { pluginStore },
      );

      expect(screen.getByRole('heading', { name: 'Test perspective name' })).toBeVisible();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('perspective-progress-icon')).not.toBeInTheDocument();
    });
  });
});
