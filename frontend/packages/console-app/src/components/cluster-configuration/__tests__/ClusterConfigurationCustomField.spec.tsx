import { screen } from '@testing-library/react';
import type { ClusterConfigurationCustomField as ClusterConfigurationCustomFieldType } from '@console/dynamic-plugin-sdk/src';
import { ClusterConfigurationFieldType } from '@console/dynamic-plugin-sdk/src';
import type { ResolvedCodeRefProperties } from '@console/dynamic-plugin-sdk/src/types';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import ClusterConfigurationCustomField from '../ClusterConfigurationCustomField';
import type { ResolvedClusterConfigurationItem } from '../types';

describe('ClusterConfigurationCustomField', () => {
  const MockCustomComponent = () => <div>Custom Component Content</div>;

  const createMockItem = (readonly: boolean): ResolvedClusterConfigurationItem => ({
    id: 'test-item',
    groupId: 'test-group',
    label: 'Test Custom Field',
    description: 'Test description',
    field: {
      type: ClusterConfigurationFieldType.custom,
      component: MockCustomComponent,
    },
    readonly,
  });

  const createMockField = (
    props?: ClusterConfigurationCustomFieldType['props'],
  ): ResolvedCodeRefProperties<ClusterConfigurationCustomFieldType> => ({
    type: ClusterConfigurationFieldType.custom,
    component: MockCustomComponent,
    props,
  });

  it('should render custom component', () => {
    const item = createMockItem(false);
    const field = createMockField();

    renderWithProviders(<ClusterConfigurationCustomField item={item} field={field} />);

    expect(screen.getByRole('group', { name: 'Test Custom Field' })).toBeVisible();
    expect(screen.getByText('Custom Component Content')).toBeVisible();
  });

  it('should wrap content in error boundary', () => {
    const item = createMockItem(false);
    const field = createMockField();

    renderWithProviders(<ClusterConfigurationCustomField item={item} field={field} />);

    expect(screen.getByRole('region', { name: 'Inline error boundary' })).toBeVisible();
  });

  it('should wrap content in form layout', () => {
    const item = createMockItem(false);
    const field = createMockField();

    renderWithProviders(<ClusterConfigurationCustomField item={item} field={field} />);

    expect(screen.getByRole('region', { name: 'Form layout' })).toBeVisible();
  });

  it('should pass readonly prop to custom component when false', () => {
    const item = createMockItem(false);
    const field = createMockField();

    renderWithProviders(<ClusterConfigurationCustomField item={item} field={field} />);

    expect(screen.getByRole('group', { name: 'Test Custom Field' })).toHaveAttribute(
      'data-readonly',
      'false',
    );
  });

  it('should pass readonly prop to custom component when true', () => {
    const item = createMockItem(true);
    const field = createMockField();

    renderWithProviders(<ClusterConfigurationCustomField item={item} field={field} />);

    expect(screen.getByRole('group', { name: 'Test Custom Field' })).toHaveAttribute(
      'data-readonly',
      'true',
    );
  });

  it('should pass custom props to component', () => {
    const CustomComponentWithProps = ({
      customProp,
    }: {
      readonly: boolean;
      customProp?: string;
    }) => <p aria-label="Extension with custom props">{customProp}</p>;

    const item = createMockItem(false);
    const field: ResolvedCodeRefProperties<ClusterConfigurationCustomFieldType> = {
      type: ClusterConfigurationFieldType.custom,
      component: CustomComponentWithProps,
      props: { customProp: 'test-value' },
    };

    renderWithProviders(<ClusterConfigurationCustomField item={item} field={field} />);

    expect(screen.getByLabelText('Extension with custom props')).toHaveTextContent('test-value');
  });
});
