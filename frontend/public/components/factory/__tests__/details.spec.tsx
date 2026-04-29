import { screen } from '@testing-library/react';
import { DetailsPage } from '@console/internal/components/factory/details';
import { PodModel } from '@console/internal/models';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { K8sModel } from '@console/dynamic-plugin-sdk/src/api/common-types';
import * as k8sWatchHook from '@console/internal/components/utils/k8s-watch-hook';

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResources: jest.fn(() => ({})),
  useK8sWatchResource: jest.fn(() => [null, true, null]),
}));

const mockUseK8sWatchResources = k8sWatchHook.useK8sWatchResources as jest.Mock;

const MockPageComponent = () => <div>Mock Page Content</div>;

const createMockPages = () => [
  { href: 'details', name: 'Details', component: MockPageComponent },
  { href: 'yaml', name: 'YAML', component: MockPageComponent },
  { href: 'events', name: 'Events', component: MockPageComponent },
];

const podModel: K8sModel = PodModel;

const defaultProps = {
  name: 'example-pod',
  namespace: 'default',
  kind: 'Pod',
  kindObj: podModel,
  pages: createMockPages(),
};

describe('Resource DetailsPage', () => {
  beforeEach(() => {
    mockUseK8sWatchResources.mockClear();
    mockUseK8sWatchResources.mockReturnValue({ obj: { data: null, loaded: true } });
  });

  it('should verify the detail page basic information and navigation tabs', () => {
    renderWithProviders(<DetailsPage {...defaultProps} />);

    // Verify hook was called
    expect(mockUseK8sWatchResources).toHaveBeenCalled();
    const watchConfig = mockUseK8sWatchResources.mock.calls[0]?.[0] as any;
    expect(watchConfig?.obj).toBeDefined();
    expect(watchConfig?.obj?.kind).toBe('Pod');

    // Verify resource information is displayed
    expect(screen.getByText('Pod')).toBeVisible();
    expect(screen.getByText('example-pod')).toBeVisible();

    // Verify navigation tabs are present and accessible
    expect(screen.getByRole('tab', { name: 'Details' })).toBeVisible();
    expect(screen.getByRole('tab', { name: 'YAML' })).toBeVisible();
    expect(screen.getByRole('tab', { name: 'Events' })).toBeVisible();
  });

  it('should verify details page with extra resources passed to useK8sWatchResources', () => {
    const extraResource = [
      {
        kind: 'ConfigMap',
        name: 'example-configmap',
        namespace: 'example-namespace',
        isList: false,
        prop: 'configMap',
      },
    ];
    mockUseK8sWatchResources.mockReturnValue({
      obj: { data: null, loaded: true },
      configMap: { data: null, loaded: true },
    });

    renderWithProviders(<DetailsPage {...defaultProps} resources={extraResource} />);

    // Verify hook was called with both resources
    expect(mockUseK8sWatchResources).toHaveBeenCalled();
    const watchConfig = mockUseK8sWatchResources.mock.calls[0]?.[0] as any;

    // Verify total resources count (1 from defaultProps + 1 extra)
    expect(Object.keys(watchConfig || {})).toHaveLength(2);

    // Verify basic UI elements are still present
    expect(screen.getByText('example-pod')).toBeVisible();
    expect(screen.getByRole('tab', { name: 'Details' })).toBeVisible();
    expect(screen.getByRole('tab', { name: 'YAML' })).toBeVisible();
    expect(screen.getByRole('tab', { name: 'Events' })).toBeVisible();

    // Verify Pod resource from DetailsPage props
    expect(watchConfig?.obj).toEqual({
      kind: defaultProps.kind,
      name: defaultProps.name,
      namespace: defaultProps.namespace,
      isList: false,
      selector: undefined,
      fieldSelector: undefined,
      limit: undefined,
      namespaced: undefined,
      optional: undefined,
    });

    // Verify extra ConfigMap resource from DetailsPage props
    expect(watchConfig?.configMap).toEqual({
      kind: 'ConfigMap',
      name: 'example-configmap',
      namespace: 'example-namespace',
      isList: false,
      selector: undefined,
      fieldSelector: undefined,
      limit: undefined,
      namespaced: undefined,
      optional: undefined,
    });
  });
});
