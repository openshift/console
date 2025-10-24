import { screen, act } from '@testing-library/react';

import { DetailsPage } from '@console/internal/components/factory/details';
import { PodModel } from '@console/internal/models';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { K8sModel } from '@console/dynamic-plugin-sdk/src/api/common-types';

let capturedFirehoseProps = null;

jest.mock('@console/internal/components/utils/firehose', () => ({
  Firehose: (props) => {
    capturedFirehoseProps = props;
    return props.children;
  },
}));

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
    capturedFirehoseProps = null;
  });

  it('should verify the detail page basic information and navigation tabs', async () => {
    await act(async () => {
      renderWithProviders(<DetailsPage {...defaultProps} />);
    });

    // Verify Firehose receives the expected resources
    expect(capturedFirehoseProps.resources).toHaveLength(1);

    // Verify resource information is displayed
    expect(screen.getByText('Pod')).toBeVisible();
    expect(screen.getByText('example-pod')).toBeVisible();

    // Verify navigation tabs are present and accessible
    expect(screen.getByRole('tab', { name: 'Details' })).toBeVisible();
    expect(screen.getByRole('tab', { name: 'YAML' })).toBeVisible();
    expect(screen.getByRole('tab', { name: 'Events' })).toBeVisible();
  });

  it('should verify details page with extra resources passed to Firehose', async () => {
    const extraResource = [
      {
        kind: 'ConfigMap',
        name: 'example-configmap',
        namespace: 'example-namespace',
        isList: false,
        prop: 'configMap',
      },
    ];
    await act(async () => {
      renderWithProviders(<DetailsPage {...defaultProps} resources={extraResource} />);
    });

    // Verify total resources count (1 from defaultProps + 1 extra)
    expect(capturedFirehoseProps.resources).toHaveLength(2);

    // Verify basic UI elements are still present
    expect(screen.getByText('example-pod')).toBeVisible();
    expect(screen.getByRole('tab', { name: 'Details' })).toBeVisible();
    expect(screen.getByRole('tab', { name: 'YAML' })).toBeVisible();
    expect(screen.getByRole('tab', { name: 'Events' })).toBeVisible();

    // Verify Pod resource from DetailsPage props
    expect(capturedFirehoseProps.resources[0]).toEqual({
      kind: defaultProps.kind,
      name: defaultProps.name,
      namespace: defaultProps.namespace,
      isList: false,
      prop: 'obj',
    });

    // Verify extra ConfigMap resource from DetailsPage props
    expect(capturedFirehoseProps.resources[1]).toEqual(extraResource[0]);
  });
});
