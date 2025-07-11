import * as React from 'react';
import { act, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { DetailsPage } from '@console/internal/components/factory/details';
import { PodModel, ConfigMapModel } from '@console/internal/models';
import { referenceForModel } from '@console/internal/module/k8s';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';

// Capture Firehose props to verify resources are passed correctly
let capturedFirehoseProps = null;

jest.mock('@console/internal/components/utils/firehose', () => ({
  Firehose: (props) => {
    capturedFirehoseProps = props;
    return props.children;
  },
}));

// Mock page components to prevent undefined component warnings
const MockPageComponent = () =>
  React.createElement('div', { 'data-testid': 'mock-page' }, 'Mock Page Content');

const createMockPages = () => [
  { href: 'details', name: 'Details', component: MockPageComponent },
  { href: 'yaml', name: 'YAML', component: MockPageComponent },
  { href: 'events', name: 'Events', component: MockPageComponent },
];

const defaultProps = {
  name: 'example-pod',
  namespace: 'default',
  kind: referenceForModel(PodModel),
  kindObj: PodModel,
  pages: createMockPages(),
};

describe('Resource DetailsPage', () => {
  beforeEach(() => {
    capturedFirehoseProps = null;
  });

  it('verify the detail page basic information and navigation tabs', async () => {
    await act(async () => {
      renderWithProviders(<DetailsPage {...defaultProps} />);
    });

    expect(capturedFirehoseProps.resources).toHaveLength(1);
    expect(screen.getByText('Pod')).toBeVisible();
    expect(screen.getByText('example-pod')).toBeVisible();

    // Verify navigation tabs are visible
    expect(screen.getByRole('tab', { name: 'Details' })).toBeVisible();
    expect(screen.getByRole('tab', { name: 'YAML' })).toBeVisible();
    expect(screen.getByRole('tab', { name: 'Events' })).toBeVisible();
  });

  it('verify details page with extra resources passed to Firehose', async () => {
    const extraResource = [
      {
        kind: referenceForModel(ConfigMapModel),
        name: 'example-configmap',
        namespace: 'example-namespace',
        isList: false,
        prop: 'configMap',
      },
    ];

    await act(async () => {
      renderWithProviders(<DetailsPage {...defaultProps} resources={extraResource} />);
    });

    // Verify UI renders correctly
    expect(capturedFirehoseProps.resources).toHaveLength(2);
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
