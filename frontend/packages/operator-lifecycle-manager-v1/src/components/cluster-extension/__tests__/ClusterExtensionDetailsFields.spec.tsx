import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAccessReview } from '@console/dynamic-plugin-sdk/src/app/components/utils/rbac';
import { k8sPatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import {
  renderWithProviders,
  verifyInputField,
} from '@console/shared/src/test-utils/unit-test-utils';
import type { ClusterExtensionKind } from '../../../types';
import { ClusterExtensionCatalogsUpdateModal } from '../ClusterExtensionCatalogsUpdateModal';
import { ClusterExtensionChannelsUpdateModal } from '../ClusterExtensionChannelsUpdateModal';
import { ClusterExtensionVersionUpdateModal } from '../ClusterExtensionVersionUpdateModal';

jest.mock('@console/dynamic-plugin-sdk/src/app/components/utils/rbac', () => ({
  useAccessReview: jest.fn(() => [true, false]),
}));

jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s', () => ({
  ...jest.requireActual('@console/dynamic-plugin-sdk/src/utils/k8s'),
  k8sPatchResource: jest.fn(),
}));

const clusterExtension: ClusterExtensionKind = {
  apiVersion: 'olm.operatorframework.io/v1',
  kind: 'ClusterExtension',
  metadata: { name: 'my-operator' },
  spec: {
    source: {
      catalog: {
        packageName: 'my-operator',
        channels: ['stable'],
        selector: {
          matchLabels: { 'olm.operatorframework.io/metadata.name': 'redhat-operators' },
        },
        version: '1.0.0',
      },
    },
  },
};

const fields = [
  {
    Component: ClusterExtensionCatalogsUpdateModal,
    path: 'selector',
    value: 'redhat-operators',
    label: 'Catalogs',
    title: 'Edit catalogs',
    helpText: 'Package will only be resolved from specified catalogs.',
    nextValue: 'community',
    expected: {
      matchExpressions: [
        {
          key: 'olm.operatorframework.io/metadata.name',
          operator: 'In',
          values: ['redhat-operators', 'community'],
        },
      ],
    },
  },
  {
    Component: ClusterExtensionChannelsUpdateModal,
    path: 'channels',
    value: 'stable',
    label: 'Channels',
    title: 'Edit channels',
    helpText: 'For example, stable, beta',
    nextValue: 'beta',
    expected: ['stable', 'beta'],
  },
  {
    Component: ClusterExtensionVersionUpdateModal,
    path: 'version',
    value: '1.0.0',
    label: 'Version or version range',
    title: 'Edit version',
    helpText: 'For example, 1.2.3 for an exact version, or >1.2.3 <1.4.5 for a range',
    nextValue: '>=1.2.3 <1.4.5',
    expected: '>=1.2.3 <1.4.5',
  },
];

describe('ClusterExtension details fields', () => {
  beforeEach(() => {
    (useAccessReview as jest.Mock).mockReturnValue([true, false]);
    (k8sPatchResource as jest.Mock).mockResolvedValue(clusterExtension);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('explains where to view and edit a custom catalog selector', () => {
    const resource = {
      ...clusterExtension,
      spec: {
        source: {
          catalog: {
            ...clusterExtension.spec.source.catalog,
            selector: { matchLabels: { provider: 'trusted' } },
          },
        },
      },
    };
    renderWithProviders(<ClusterExtensionCatalogsUpdateModal obj={resource} />);
    expect(
      screen.getByRole('button', {
        name: 'Custom catalog selector. To view or edit it, use the YAML tab.',
      }),
    ).toBeVisible();
  });

  it('removes duplicate channels as a single selection', async () => {
    const user = userEvent.setup();
    const resource = {
      ...clusterExtension,
      spec: {
        source: {
          catalog: { ...clusterExtension.spec.source.catalog, channels: ['stable', 'stable'] },
        },
      },
    };
    renderWithProviders(<ClusterExtensionChannelsUpdateModal obj={resource} />);
    await user.click(screen.getByRole('button', { name: 'stable, stable' }));
    await user.click(screen.getByRole('button', { name: 'Close stable' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => {
      expect(k8sPatchResource).toHaveBeenCalledWith(
        expect.objectContaining({
          data: [{ op: 'remove', path: '/spec/source/catalog/channels' }],
        }),
      );
    });
  });

  it.each(fields)(
    'shows $path without edit controls when patch access is denied',
    ({ Component, value }) => {
      (useAccessReview as jest.Mock).mockReturnValue([false, false]);
      renderWithProviders(<Component obj={clusterExtension} />);
      expect(screen.getByText(value)).toBeVisible();
      expect(screen.queryByRole('button', { name: value })).not.toBeInTheDocument();
    },
  );

  it.each(fields)(
    'edits only $path and patches only that property',
    async ({ Component, path, value, label, title, helpText, nextValue, expected }) => {
      const user = userEvent.setup();
      renderWithProviders(<Component obj={clusterExtension} />);
      await user.click(screen.getByRole('button', { name: value }));

      expect(screen.getByRole('heading', { name: title })).toBeVisible();
      expect(screen.getAllByRole('textbox')).toHaveLength(1);
      await verifyInputField({ inputLabel: label, helpText, testValue: nextValue });
      await user.tab();
      await user.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => {
        expect(k8sPatchResource).toHaveBeenCalledWith(
          expect.objectContaining({
            data: [{ op: 'add', path: `/spec/source/catalog/${path}`, value: expected }],
          }),
        );
        expect(screen.queryByRole('heading', { name: title })).not.toBeInTheDocument();
      });
    },
  );

  it.each(fields)('clears only $path', async ({ Component, path, value, label, title }) => {
    const user = userEvent.setup();
    renderWithProviders(<Component obj={clusterExtension} />);
    await user.click(screen.getByRole('button', { name: value }));
    if (path === 'version') {
      await user.clear(screen.getByRole('textbox', { name: label }));
    } else {
      await user.click(screen.getByRole('button', { name: `Close ${value}` }));
    }
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(k8sPatchResource).toHaveBeenCalledWith(
        expect.objectContaining({
          data: [{ op: 'remove', path: `/spec/source/catalog/${path}` }],
        }),
      );
      expect(screen.queryByRole('heading', { name: title })).not.toBeInTheDocument();
    });
  });

  it.each([{ names: ['community', 'certified'] }, { names: ['community'] }, { names: [] }])(
    'preserves custom selector rules when selecting $names',
    async ({ names }) => {
      const user = userEvent.setup();
      const selector = {
        matchLabels: {
          provider: 'trusted',
          'olm.operatorframework.io/metadata.name': 'redhat-operators',
        },
        matchExpressions: [{ key: 'support', operator: 'Exists' }],
      };
      const resource = {
        ...clusterExtension,
        spec: { source: { catalog: { ...clusterExtension.spec.source.catalog, selector } } },
      };
      renderWithProviders(<ClusterExtensionCatalogsUpdateModal obj={resource} />);
      await user.click(screen.getByRole('button', { name: 'redhat-operators' }));
      await user.click(screen.getByRole('button', { name: 'Close redhat-operators' }));
      await names.reduce(async (previous, name) => {
        await previous;
        await verifyInputField({ inputLabel: 'Catalogs', testValue: name });
        await user.tab();
      }, Promise.resolve());
      await user.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => {
        expect(k8sPatchResource).toHaveBeenCalledWith(
          expect.objectContaining({
            data: [
              {
                op: 'add',
                path: '/spec/source/catalog/selector',
                value: {
                  matchLabels: {
                    provider: 'trusted',
                    ...(names.length === 1
                      ? { 'olm.operatorframework.io/metadata.name': names[0] }
                      : {}),
                  },
                  matchExpressions: [
                    { key: 'support', operator: 'Exists' },
                    ...(names.length > 1
                      ? [
                          {
                            key: 'olm.operatorframework.io/metadata.name',
                            operator: 'In',
                            values: names,
                          },
                        ]
                      : []),
                  ],
                },
              },
            ],
          }),
        );
        expect(screen.queryByRole('heading', { name: 'Edit catalogs' })).not.toBeInTheDocument();
      });
    },
  );

  it('displays API errors and lets users correct version input', async () => {
    const user = userEvent.setup();
    const apiError = new Error('API server rejected update constraints');
    (k8sPatchResource as jest.Mock).mockRejectedValueOnce(apiError);
    renderWithProviders(<ClusterExtensionVersionUpdateModal obj={clusterExtension} />);
    await user.click(screen.getByRole('button', { name: '1.0.0' }));
    const version = 'not-a-version'.repeat(6);
    await verifyInputField({ inputLabel: 'Version or version range', testValue: version });
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText(apiError.toString())).toBeVisible();
    expect(k8sPatchResource).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [{ op: 'add', path: '/spec/source/catalog/version', value: version }],
      }),
    );
    await verifyInputField({ inputLabel: 'Version or version range', testValue: '2.0.0' });
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => {
      expect(k8sPatchResource).toHaveBeenCalledTimes(2);
      expect(screen.queryByRole('heading', { name: 'Edit version' })).not.toBeInTheDocument();
    });
  });

  it.each(fields)(
    'cancels $path edits without patching',
    async ({ Component, path, value, label, title, nextValue }) => {
      const user = userEvent.setup();
      renderWithProviders(<Component obj={clusterExtension} />);
      await user.click(screen.getByRole('button', { name: value }));
      await verifyInputField({ inputLabel: label, testValue: nextValue });
      await user.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(k8sPatchResource).not.toHaveBeenCalled();
      expect(screen.queryByRole('heading', { name: title })).not.toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: value }));
      expect(screen.getByRole('textbox', { name: label })).toHaveValue(
        path === 'version' ? value : '',
      );
    },
  );

  it.each([
    { catalog: undefined, patchPath: '/spec/source/catalog', expected: { version: '2.0.0' } },
    {
      catalog: { packageName: 'my-operator' },
      patchPath: '/spec/source/catalog/version',
      expected: '2.0.0',
    },
  ])('adds missing version with catalog $catalog', async ({ catalog, patchPath, expected }) => {
    const user = userEvent.setup();
    const resource = { ...clusterExtension, spec: { source: { catalog } } };
    renderWithProviders(<ClusterExtensionVersionUpdateModal obj={resource} />);
    await user.click(screen.getByRole('button', { name: 'Any version' }));
    await verifyInputField({ inputLabel: 'Version or version range', testValue: '2.0.0' });
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => {
      expect(k8sPatchResource).toHaveBeenCalledWith(
        expect.objectContaining({
          data: [{ op: 'add', path: patchPath, value: expected }],
        }),
      );
      expect(screen.queryByRole('heading', { name: 'Edit version' })).not.toBeInTheDocument();
    });
  });

  it.each(fields)(
    'leaves absent $path untouched when saving an empty field',
    async ({ Component, path, title }) => {
      const user = userEvent.setup();
      const resource = {
        ...clusterExtension,
        spec: { source: { catalog: { packageName: 'my-operator' } } },
      };
      renderWithProviders(<Component obj={resource} />);
      await user.click(
        screen.getByRole('button', {
          name:
            path === 'selector'
              ? 'All catalogs'
              : path === 'channels'
                ? 'All channels'
                : 'Any version',
        }),
      );
      await user.click(screen.getByRole('button', { name: 'Save' }));
      expect(k8sPatchResource).not.toHaveBeenCalled();
      expect(screen.queryByRole('heading', { name: title })).not.toBeInTheDocument();
    },
  );

  it('guards concurrent writes using opening resource version and patches only version', async () => {
    const user = userEvent.setup();
    const resource = {
      ...clusterExtension,
      metadata: { ...clusterExtension.metadata, resourceVersion: '10' },
    };
    const { rerender } = renderWithProviders(<ClusterExtensionVersionUpdateModal obj={resource} />);
    await user.click(screen.getByRole('button', { name: '1.0.0' }));
    rerender(
      <ClusterExtensionVersionUpdateModal
        obj={{
          ...resource,
          metadata: { ...resource.metadata, resourceVersion: '11' },
          spec: { source: { catalog: { ...resource.spec.source.catalog, channels: ['beta'] } } },
        }}
      />,
    );
    await verifyInputField({ inputLabel: 'Version or version range', testValue: '2.0.0' });
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => {
      expect(k8sPatchResource).toHaveBeenCalledWith(
        expect.objectContaining({
          data: [
            { op: 'test', path: '/metadata/resourceVersion', value: '10' },
            { op: 'add', path: '/spec/source/catalog/version', value: '2.0.0' },
          ],
        }),
      );
      expect(screen.queryByRole('heading', { name: 'Edit version' })).not.toBeInTheDocument();
    });
  });

  it.each(fields)(
    'keeps $path edit control disabled while patch access loads',
    ({ Component, value }) => {
      (useAccessReview as jest.Mock).mockReturnValue([false, true]);
      renderWithProviders(<Component obj={clusterExtension} />);
      expect(screen.getByRole('button', { name: value })).toBeDisabled();
    },
  );
});
