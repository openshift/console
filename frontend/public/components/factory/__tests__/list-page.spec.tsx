import { screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import {
  TextFilter,
  ListPageWrapper,
  FireMan,
  MultiListPage,
} from '@console/internal/components/factory/list-page';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';

jest.mock('@console/internal/components/utils/firehose', () => ({
  Firehose: ({ children }) => {
    return typeof children === 'function' ? children({ loaded: true, loadError: false }) : children;
  },
}));

describe(TextFilter.displayName, () => {
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

  it('calls onChange when input value changes', () => {
    const onChange = jest.fn();

    renderWithProviders(<TextFilter onChange={onChange} defaultValue="" />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test-value' } });
    expect(onChange).toHaveBeenCalled();
  });
});

describe(FireMan.displayName, () => {
  it('does not render title when not provided', () => {
    renderWithProviders(<FireMan resources={[{ kind: 'Node', prop: 'obj' }]} />);
    expect(screen.queryByText('My pods')).not.toBeInTheDocument();
  });

  it('renders title when provided', () => {
    renderWithProviders(<FireMan resources={[{ kind: 'Node', prop: 'obj' }]} title="My pods" />);
    expect(screen.getByText('My pods')).toBeInTheDocument();
  });

  it('renders create button when canCreate is true', () => {
    const createProps = {};

    renderWithProviders(
      <FireMan
        resources={[{ kind: 'Node', prop: 'obj' }]}
        canCreate
        createProps={createProps}
        createButtonText="Create Me!"
        title="Nights Watch"
      />,
    );

    const button = screen.getByRole('button', { name: 'Create Me!' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('id', 'yaml-create');
  });
});

describe(ListPageWrapper.displayName, () => {
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
          { id: 'database', title: 'Databases' },
          { id: 'loadbalancer', title: 'Load Balancers' },
        ],
      },
    ];

    renderWithProviders(<ListPageWrapper {...defaultProps} rowFilters={rowFilters} />);

    // Check that the filter toolbar is rendered (which would contain row filters)
    const toolbar = screen.getByRole('button', { name: 'Filter' });
    expect(toolbar).toBeInTheDocument();
  });

  it('renders the provided ListComponent', () => {
    renderWithProviders(<ListPageWrapper {...defaultProps} />);

    expect(screen.getByText('List Content')).toBeVisible();
  });
});

describe(MultiListPage.displayName, () => {
  it('renders with Firehose wrapper and displays ListComponent content', () => {
    const ListComponent = () => <div>Multi List</div>;

    renderWithProviders(
      <MultiListPage
        ListComponent={ListComponent}
        resources={[{ kind: 'Pod' }]}
        filterLabel="by name"
      />,
    );

    expect(screen.getByText('Multi List')).toBeVisible();
  });
});
