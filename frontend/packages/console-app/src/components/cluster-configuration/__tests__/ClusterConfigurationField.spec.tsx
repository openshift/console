import { render, screen } from '@testing-library/react';
import { ClusterConfigurationFieldType } from '@console/dynamic-plugin-sdk/src';
import ClusterConfigurationCustomField from '../ClusterConfigurationCustomField';
import ClusterConfigurationField from '../ClusterConfigurationField';
import type { ResolvedClusterConfigurationItem } from '../types';

jest.mock('../ClusterConfigurationCustomField', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const MockClusterConfigurationCustomField = ClusterConfigurationCustomField as jest.Mock;

describe('ClusterConfigurationField', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    MockClusterConfigurationCustomField.mockImplementation(({ item }) => item.label);
  });

  const createMockItem = (): ResolvedClusterConfigurationItem => ({
    id: 'test-item',
    groupId: 'test-group',
    label: 'Test Field Label',
    description: 'Test description',
    field: {
      type: ClusterConfigurationFieldType.custom,
      component: jest.fn(),
    },
    readonly: false,
  });

  it('should render ClusterConfigurationCustomField for custom field type', () => {
    const item = createMockItem();
    render(<ClusterConfigurationField item={item} />);

    expect(screen.getByText('Test Field Label')).toBeVisible();
    expect(MockClusterConfigurationCustomField).toHaveBeenCalled();
  });

  it('should render null for unsupported field type', () => {
    const item = {
      ...createMockItem(),
      field: {
        type: 'unsupported' as typeof ClusterConfigurationFieldType.custom,
        component: jest.fn(),
      },
    };

    render(<ClusterConfigurationField item={item} />);
    expect(MockClusterConfigurationCustomField).not.toHaveBeenCalled();
    expect(screen.queryByText('Test Field Label')).not.toBeInTheDocument();
  });

  it('should pass readonly state to child component', () => {
    MockClusterConfigurationCustomField.mockImplementation(({ item }) =>
      item.readonly ? `${item.label} (read-only)` : item.label,
    );
    const item = {
      ...createMockItem(),
      readonly: true,
    };
    render(<ClusterConfigurationField item={item} />);

    expect(screen.getByText('Test Field Label (read-only)')).toBeVisible();
  });

  it('should render with correct item properties', () => {
    const item: ResolvedClusterConfigurationItem = {
      id: 'unique-id',
      groupId: 'group-1',
      label: 'Unique Label',
      description: 'Unique description',
      field: {
        type: ClusterConfigurationFieldType.custom,
        component: jest.fn(),
      },
      readonly: false,
    };

    render(<ClusterConfigurationField item={item} />);

    expect(screen.getByText('Unique Label')).toBeVisible();
    expect(MockClusterConfigurationCustomField).toHaveBeenCalled();
  });

  it('should handle text field type by returning null', () => {
    const item = {
      ...createMockItem(),
      field: {
        type: ClusterConfigurationFieldType.text as typeof ClusterConfigurationFieldType.custom,
        component: jest.fn(),
      },
    };

    render(<ClusterConfigurationField item={item} />);
    expect(MockClusterConfigurationCustomField).not.toHaveBeenCalled();
  });
});
