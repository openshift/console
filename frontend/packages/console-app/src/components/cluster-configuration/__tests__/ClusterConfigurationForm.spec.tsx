import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClusterConfigurationFieldType } from '@console/dynamic-plugin-sdk/src';
import ClusterConfigurationField from '../ClusterConfigurationField';
import ClusterConfigurationForm from '../ClusterConfigurationForm';
import type { ResolvedClusterConfigurationItem } from '../types';

jest.mock('../ClusterConfigurationField', () => ({
  __esModule: true,
  default: jest.fn(({ item }: { item: ResolvedClusterConfigurationItem }) => item.label),
}));

const MockClusterConfigurationField = ClusterConfigurationField as jest.MockedFunction<
  typeof ClusterConfigurationField
>;

describe('ClusterConfigurationForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockItem = (id: string, label: string): ResolvedClusterConfigurationItem => ({
    id,
    groupId: 'test-group',
    label,
    description: `Description for ${label}`,
    field: {
      type: ClusterConfigurationFieldType.custom,
      component: jest.fn(),
    },
    readonly: false,
  });

  it('should render form with multiple items', () => {
    const items = [createMockItem('item-1', 'First Item'), createMockItem('item-2', 'Second Item')];

    render(<ClusterConfigurationForm items={items} />);

    const form = screen.getByRole('form', { name: 'Cluster configuration' });
    expect(form).toHaveTextContent('First Item');
    expect(form).toHaveTextContent('Second Item');
    expect(MockClusterConfigurationField).toHaveBeenCalledTimes(2);
  });

  it('should render null when items array is empty', () => {
    render(<ClusterConfigurationForm items={[]} />);

    expect(screen.queryByRole('form', { name: 'Cluster configuration' })).not.toBeInTheDocument();
    expect(MockClusterConfigurationField).not.toHaveBeenCalled();
  });

  it('should render null when items is undefined', () => {
    render(<ClusterConfigurationForm />);

    expect(screen.queryByRole('form', { name: 'Cluster configuration' })).not.toBeInTheDocument();
    expect(MockClusterConfigurationField).not.toHaveBeenCalled();
  });

  it('should call preventDefault on submit', async () => {
    const user = userEvent.setup();
    MockClusterConfigurationField.mockImplementationOnce(() => (
      <button type="submit">Submit configuration</button>
    ));

    const items = [createMockItem('item-1', 'Test Item')];
    render(<ClusterConfigurationForm items={items} />);

    const preventDefaultSpy = jest.spyOn(Event.prototype, 'preventDefault');
    await user.click(screen.getByRole('button', { name: 'Submit configuration' }));
    expect(preventDefaultSpy).toHaveBeenCalled();
    preventDefaultSpy.mockRestore();
  });

  it('should render each item with unique key', () => {
    const items = [
      createMockItem('unique-id-1', 'Item One'),
      createMockItem('unique-id-2', 'Item Two'),
      createMockItem('unique-id-3', 'Item Three'),
    ];

    render(<ClusterConfigurationForm items={items} />);

    const form = screen.getByRole('form', { name: 'Cluster configuration' });
    expect(form).toHaveTextContent('Item One');
    expect(form).toHaveTextContent('Item Two');
    expect(form).toHaveTextContent('Item Three');
    expect(MockClusterConfigurationField).toHaveBeenCalledTimes(3);
  });
});
