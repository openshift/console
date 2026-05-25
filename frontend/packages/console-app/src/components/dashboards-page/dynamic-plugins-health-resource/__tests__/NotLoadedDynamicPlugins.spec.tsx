import type { FailedPluginInfoEntry, PendingPluginInfoEntry } from '@openshift/dynamic-plugin-sdk';
import { render, screen } from '@testing-library/react';
import NotLoadedDynamicPlugins from '../NotLoadedDynamicPlugins';

jest.mock('@console/internal/components/utils/resource-link', () => ({
  ResourceLink: jest.fn(({ name }: { name: string }) => name),
}));

jest.mock('@console/internal/models', () => ({
  ConsolePluginModel: {
    kind: 'ConsolePlugin',
    apiVersion: 'console.openshift.io/v1',
    apiGroup: 'console.openshift.io',
    plural: 'consoleplugins',
  },
}));

jest.mock('@console/internal/module/k8s', () => ({
  referenceForModel: jest.fn(() => 'console.openshift.io~v1~ConsolePlugin'),
}));

describe('NotLoadedDynamicPlugins', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockPlugin = (name: string): FailedPluginInfoEntry | PendingPluginInfoEntry =>
    ({
      status: 'failed',
      manifest: {
        name,
        version: '1.0.0',
      },
    } as FailedPluginInfoEntry);

  it('should render section label', () => {
    const plugins = [createMockPlugin('test-plugin')];

    render(<NotLoadedDynamicPlugins plugins={plugins} label="Failed plugins" />);

    expect(screen.getByText('Failed plugins')).toBeVisible();
  });

  it('should render single plugin as resource link', () => {
    const plugins = [createMockPlugin('my-plugin')];

    render(<NotLoadedDynamicPlugins plugins={plugins} label="Failed plugins" />);

    expect(screen.getByText('my-plugin')).toBeVisible();
  });

  it('should render multiple plugins as list', () => {
    const plugins = [
      createMockPlugin('plugin-one'),
      createMockPlugin('plugin-two'),
      createMockPlugin('plugin-three'),
    ];

    render(<NotLoadedDynamicPlugins plugins={plugins} label="Pending plugins" />);

    expect(screen.getByText('plugin-one')).toBeVisible();
    expect(screen.getByText('plugin-two')).toBeVisible();
    expect(screen.getByText('plugin-three')).toBeVisible();
  });

  it('should render empty list when no plugins provided', () => {
    render(<NotLoadedDynamicPlugins plugins={[]} label="Failed plugins" />);

    expect(screen.getByText('Failed plugins')).toBeVisible();
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });
});
