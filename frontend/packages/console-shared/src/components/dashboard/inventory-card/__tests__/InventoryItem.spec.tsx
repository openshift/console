import { screen } from '@testing-library/react';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk/src/api/useResolvedExtensions';
import type { K8sResourceCommon } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { PodModel } from '@console/internal/models';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { ResourceInventoryItem } from '../InventoryItem';

jest.mock('@console/dynamic-plugin-sdk/src/api/useResolvedExtensions', () => ({
  useResolvedExtensions: jest.fn(),
}));
beforeEach(() => {
  jest.mocked(useResolvedExtensions).mockReturnValue([[], true, []]);
});
const resources: K8sResourceCommon[] = [
  { metadata: { name: 'one' } },
  { metadata: { name: 'two' } },
];
const props = { kind: PodModel, resources, isLoading: false, error: false };

it('uses the resource length when no mapper is supplied', () => {
  renderWithProviders(<ResourceInventoryItem {...props} />);
  expect(screen.getByRole('link', { name: '2 Pods' })).toBeVisible();
});
it('preserves the legacy three-slot behavior when the mapper includes healthy resources', () => {
  const mapper = () => ({
    NOT_MAPPED: { count: 5, statusIDs: [] },
    ERROR: { count: 1, statusIDs: ['Failed'], filterType: 'status' },
    WARN: { count: 1, statusIDs: ['Unknown'], filterType: 'status' },
    PROGRESS: { count: 1, statusIDs: ['Pending'], filterType: 'status' },
  });
  renderWithProviders(<ResourceInventoryItem {...props} mapper={mapper} />);
  expect(screen.getByRole('link', { name: '8 Pods' })).toBeVisible();
  expect(screen.getAllByRole('link', { name: '1' })).toHaveLength(2);
  expect(screen.getAllByRole('link').map((link) => link.getAttribute('href'))).not.toContain(
    '/k8s/all-namespaces/pods?status=Pending',
  );
});
it('continues to count resources supplied through additionalResources', () => {
  const mapper = (_resources: K8sResourceCommon[], additional: { extra: K8sResourceCommon[] }) => ({
    NOT_MAPPED: { count: _resources.length + additional.extra.length, statusIDs: [] },
  });
  renderWithProviders(
    <ResourceInventoryItem {...props} mapper={mapper} additionalResources={{ extra: resources }} />,
  );
  expect(screen.getByRole('link', { name: '4 Pods' })).toBeVisible();
});
it('continues to support non-linked tiles', () => {
  renderWithProviders(<ResourceInventoryItem {...props} showLink={false} />);
  expect(screen.getByText('2 Pods')).toBeVisible();
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
});
it('continues to show unavailable when resource loading fails', () => {
  renderWithProviders(<ResourceInventoryItem {...props} error />);
  expect(screen.getByText('Not available')).toBeVisible();
});
