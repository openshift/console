import { screen, fireEvent } from '@testing-library/react';
import { TextFilter } from '@console/internal/components/factory/text-filter';
import {
  ListPageWrapper,
  FireMan,
  MultiListPage,
} from '@console/internal/components/factory/list-page';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import * as k8sWatchHook from '@console/internal/components/utils/k8s-watch-hook';

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResources: jest.fn(() => ({})),
  useK8sWatchResource: jest.fn(() => [null, true, null]),
}));

const mockUseK8sWatchResources = k8sWatchHook.useK8sWatchResources as jest.Mock;

describe('TextFilter component', () => {
  it('renders text input without label', () => {
    const onChange = jest.fn();
    const defaultValue = '';

    renderWithProviders(<TextFilter onChange={onChange} defaultValue={defaultValue} />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveAttribute('placeholder', 'Filter ...');
    expect(input).toHaveValue(defaultValue);
  });

  it('renders text input with label', () => {
    const onChange = jest.fn();
    const defaultValue = '';

    renderWithProviders(
      <TextFilter label="resource" onChange={onChange} defaultValue={defaultValue} />,
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveAttribute('placeholder', 'Filter resource...');
    expect(input).toHaveValue(defaultValue);
  });

  it('renders text input with custom placeholder', () => {
    const placeholder = 'Pods';
    const onChange = jest.fn();
    const defaultValue = '';

    renderWithProviders(
      <TextFilter placeholder={placeholder} onChange={onChange} defaultValue={defaultValue} />,
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveAttribute('placeholder', placeholder);
    expect(input).toHaveValue(defaultValue);
  });

  it('calls onChange with event and new value when input changes', () => {
    const onChange = jest.fn();

    renderWithProviders(<TextFilter onChange={onChange} defaultValue="" />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test-value' } });

    expect(onChange).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(expect.any(Object), 'test-value');
  });

  it('calls onChange with empty string when input is cleared', () => {
    const onChange = jest.fn();

    renderWithProviders(<TextFilter onChange={onChange} defaultValue="initial" />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '' } });

    expect(onChange).toHaveBeenCalledWith(expect.any(Object), '');
  });
});

describe('FireMan component', () => {
  it('does not render title when not provided', () => {
    renderWithProviders(<FireMan resources={[]} />);
    expect(screen.queryByText('My pods')).not.toBeInTheDocument();
  });

  it('renders title when provided', () => {
    renderWithProviders(<FireMan resources={[]} title="My pods" />);
    expect(screen.getByText('My pods')).toBeVisible();
  });

  it('renders create button when canCreate is true', () => {
    const createProps = {};

    renderWithProviders(
      <FireMan
        resources={[]}
        canCreate
        createProps={createProps}
        createButtonText="Create Pod"
        title="Pod"
      />,
    );

    const button = screen.getByRole('button', { name: 'Create Pod' });
    expect(button).toBeVisible();
    expect(button).toBeEnabled();
  });
});

describe('ListPageWrapper component', () => {
  const defaultProps = {
    flatten: () => [{ kind: 'Pod' }, { kind: 'Pod' }, { kind: 'Node' }],
    ListComponent: () => <div>List Content</div>,
    kinds: ['pods'],
    rowFilters: [],
    resources: {},
    reduxIDs: [],
  };

  it('renders row filters when provided', () => {
    const rowFilters = [
      {
        filterGroupName: 'app-type',
        type: 'app-type',
        reducer: (item) => item.kind,
        items: [
          { id: 'item-1', title: 'Item-1' },
          { id: 'item-2', title: 'Item-2' },
        ],
      },
    ];

    renderWithProviders(<ListPageWrapper {...defaultProps} rowFilters={rowFilters} />);

    const toolbar = screen.getByRole('button', { name: 'Filter' });
    expect(toolbar).toBeVisible();
  });

  it('renders the provided ListComponent', () => {
    renderWithProviders(<ListPageWrapper {...defaultProps} />);

    expect(screen.getByText('List Content')).toBeVisible();
  });
});

describe(' MultiListPage component', () => {
  beforeEach(() => {
    mockUseK8sWatchResources.mockClear();
  });

  it('renders with useK8sWatchResources hook and displays ListComponent content', () => {
    const ListComponent = () => <div>Multi List</div>;
    mockUseK8sWatchResources.mockReturnValue({});

    renderWithProviders(
      <MultiListPage
        ListComponent={ListComponent}
        resources={[{ kind: 'Pod', name: 'example-pod' }]}
        filterLabel="by name"
      />,
    );

    expect(screen.getByText('Multi List')).toBeVisible();
    expect(mockUseK8sWatchResources).toHaveBeenCalled();
    const watchConfig = mockUseK8sWatchResources.mock.calls[0]?.[0] as any;
    expect(watchConfig?.Pod).toBeDefined();
    expect(watchConfig?.Pod?.kind).toBe('Pod');
    expect(watchConfig?.Pod?.name).toBe('example-pod');
  });
});
