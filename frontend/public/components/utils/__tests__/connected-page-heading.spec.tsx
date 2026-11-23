import { applyCodeRefSymbol } from '@openshift/dynamic-plugin-sdk';
import { screen, waitFor } from '@testing-library/react';
import type { ExtensionHook } from '@console/dynamic-plugin-sdk/src/api/common-types';
import type {
  Action,
  ResourceActionProvider,
} from '@console/dynamic-plugin-sdk/src/extensions/actions';
import {
  addLoadedPluginFromManifest,
  createLocalPluginManifest,
  createTestPluginStore,
} from '@console/shared/src/test-utils/plugin-test-utils';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { PodModel } from '../../../models';
import type { K8sResourceKind } from '../../../module/k8s';
import { testResourceInstance } from '../../__tests__/data/k8sResourcesMocks';
import { ConnectedPageHeading } from '../headings';
import type { ConnectedPageHeadingProps } from '../headings';

// Render the extension action menu as text so the tests can assert which context ID it
// resolved against.
jest.mock('@console/shared/src/components/actions/LazyActionMenu', () => ({
  LazyActionMenu: ({ context }) => `extension actions for ${Object.keys(context).join(',')}`,
}));

describe('ConnectedPageHeading', () => {
  it('renders resource icon if given `kind`', async () => {
    const kind = 'Pod';
    renderWithProviders(<ConnectedPageHeading.WrappedComponent obj={null} kind={kind} />);

    await waitFor(() => {
      const icon = screen.getByTitle(kind);
      expect(icon).toBeInTheDocument();
      expect(screen.getByText(kind)).toBeInTheDocument();
    });
  });

  it('renders custom title component if given', async () => {
    const title = <span>My Custom Title</span>;
    renderWithProviders(<ConnectedPageHeading.WrappedComponent obj={null} title={title} />);

    await waitFor(() => {
      expect(screen.getByText('My Custom Title')).toBeInTheDocument();
    });
  });

  it('renders breadcrumbs if given `breadcrumbsFor` function', async () => {
    const breadcrumbs = [];
    renderWithProviders(
      <ConnectedPageHeading.WrappedComponent
        obj={{ data: testResourceInstance, loaded: true, loadError: null }}
        breadcrumbsFor={() => breadcrumbs}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('page-heading-breadcrumbs')).toBeInTheDocument();
    });
  });

  it('does not render breadcrumbs if object has not loaded', async () => {
    renderWithProviders(
      <ConnectedPageHeading.WrappedComponent obj={null} breadcrumbsFor={() => []} />,
    );

    await waitFor(() => {
      expect(screen.queryByTestId('page-heading-breadcrumbs')).not.toBeInTheDocument();
    });
  });
});

describe('ConnectedPageHeading actions', () => {
  const pod: K8sResourceKind = {
    apiVersion: 'v1',
    kind: 'Pod',
    metadata: { name: 'nginx', namespace: 'default' },
  };

  const podActionsHook: ExtensionHook<Action[]> = () => [[], true, undefined];

  const podActionProvider: ResourceActionProvider = {
    type: 'console.action/resource-provider',
    properties: {
      model: { version: 'v1', kind: 'Pod' },
      provider: applyCodeRefSymbol(async () => podActionsHook),
    },
  };

  const deploymentActionProvider: ResourceActionProvider = {
    type: 'console.action/resource-provider',
    properties: {
      model: { group: 'apps', version: 'v1', kind: 'Deployment' },
      provider: applyCodeRefSymbol(async () => podActionsHook),
    },
  };

  const renderHeading = (
    props: Partial<ConnectedPageHeadingProps>,
    extensions: ResourceActionProvider[],
  ) => {
    const pluginStore = createTestPluginStore((store) => {
      addLoadedPluginFromManifest(store, createLocalPluginManifest('test-plugin'), extensions);
    });
    return renderWithProviders(
      <ConnectedPageHeading.WrappedComponent
        breadcrumbsFor={() => []}
        kind="Pod"
        kindObj={PodModel}
        obj={{ data: pod, loaded: true, loadError: null }}
        {...props}
      />,
      { pluginStore },
    );
  };

  it('renders the extension action menu when a resource provider is registered for the model', async () => {
    renderHeading({}, [podActionProvider]);

    expect(await screen.findByText('extension actions for core~v1~Pod')).toBeVisible();
  });

  it('renders no action menu when no resource provider is registered for the model', async () => {
    renderHeading({}, []);

    await waitFor(() => {
      expect(screen.queryByText(/extension actions/)).not.toBeInTheDocument();
    });
  });

  it('renders no action menu when the only provider targets a different model', async () => {
    renderHeading({}, [deploymentActionProvider]);

    await waitFor(() => {
      expect(screen.queryByText(/extension actions/)).not.toBeInTheDocument();
    });
  });

  it('renders no action menu while the model is still being discovered', async () => {
    // A bare kind such as "Pod" from a plural URL cannot match a reference-based provider
    // until connectToModel resolves the model, so discovery must not leak extension actions.
    renderHeading({ kindObj: undefined }, [podActionProvider]);

    await waitFor(() => {
      expect(screen.queryByText(/extension actions/)).not.toBeInTheDocument();
    });
  });

  it('renders no action menu when hideActions is set', async () => {
    renderHeading({ hideActions: true }, [podActionProvider]);

    await waitFor(() => {
      expect(screen.queryByText(/extension actions/)).not.toBeInTheDocument();
    });
  });

  it('prefers a customActionMenu function over extension actions', async () => {
    renderHeading(
      {
        customActionMenu: (kindObj, obj) => (
          <span>
            custom menu for {kindObj.kind} {obj.metadata.name}
          </span>
        ),
      },
      [podActionProvider],
    );

    await waitFor(() => {
      expect(screen.getByText('custom menu for Pod nginx')).toBeVisible();
      expect(screen.queryByText(/extension actions/)).not.toBeInTheDocument();
    });
  });

  it('prefers a customActionMenu node over extension actions', async () => {
    renderHeading({ customActionMenu: <span>custom node menu</span> }, [podActionProvider]);

    await waitFor(() => {
      expect(screen.getByText('custom node menu')).toBeVisible();
      expect(screen.queryByText(/extension actions/)).not.toBeInTheDocument();
    });
  });

  it('renders a customActionMenu node when there are no extension actions', async () => {
    renderHeading({ customActionMenu: <span>custom node menu</span> }, []);

    await waitFor(() => {
      expect(screen.getByText('custom node menu')).toBeVisible();
    });
  });
});
