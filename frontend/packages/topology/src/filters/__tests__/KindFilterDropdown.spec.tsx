import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { DisplayFilters } from '../../topology-types';
import { TopologyDisplayFilterType } from '../../topology-types';
import { DEFAULT_TOPOLOGY_FILTERS } from '../const';
import KindFilterDropdown from '../KindFilterDropdown';

describe(KindFilterDropdown.displayName, () => {
  let dropdownFilter: DisplayFilters;
  let onChange: jest.Mock;
  let supportedKinds: { [key: string]: number };

  beforeEach(() => {
    dropdownFilter = [...DEFAULT_TOPOLOGY_FILTERS];
    onChange = jest.fn();
    supportedKinds = {
      'Kind-B': 3,
      'Kind-A': 4,
      'Kind-D': 5,
      'Kind-E': 6,
      'Kind-F': 7,
      'Kind-C': 2,
      'Kind-G': 8,
    };
  });

  it('should render the dropdown button', () => {
    render(
      <KindFilterDropdown
        filters={dropdownFilter}
        supportedKinds={supportedKinds}
        onChange={onChange}
      />,
    );
    expect(screen.getByRole('button', { name: /filter by resource/i })).toBeInTheDocument();
  });

  it('should display all kinds as filter options when opened', async () => {
    render(
      <KindFilterDropdown
        filters={dropdownFilter}
        supportedKinds={supportedKinds}
        onChange={onChange}
        opened
      />,
    );
    const options = await screen.findAllByRole('menuitem');
    expect(options).toHaveLength(Object.keys(supportedKinds).length);
  });

  it('should not show a badge when no kinds are selected', () => {
    render(
      <KindFilterDropdown
        filters={dropdownFilter}
        supportedKinds={supportedKinds}
        onChange={onChange}
        opened
      />,
    );
    expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument(); // no badge
  });

  it('should show correct badge count when filters are selected', () => {
    dropdownFilter.push(
      {
        type: TopologyDisplayFilterType.kind,
        id: 'Kind-A',
        label: 'Kind-A',
        labelKey: 'Kind-A',
        priority: 1,
        value: true,
      },
      {
        type: TopologyDisplayFilterType.kind,
        id: 'Kind-C',
        label: 'Kind-C',
        labelKey: 'Kind-C',
        priority: 1,
        value: true,
      },
    );

    render(
      <KindFilterDropdown
        filters={dropdownFilter}
        supportedKinds={supportedKinds}
        onChange={onChange}
        opened
      />,
    );

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should mark a selected kind as checked', () => {
    dropdownFilter.push({
      type: TopologyDisplayFilterType.kind,
      id: 'Kind-A',
      label: 'Kind-A',
      labelKey: 'Kind-A',
      priority: 1,
      value: true,
    });

    render(
      <KindFilterDropdown
        filters={dropdownFilter}
        supportedKinds={supportedKinds}
        onChange={onChange}
        opened
      />,
    );

    expect(screen.getByRole('checkbox', { name: /kind-a/i })).toBeChecked();
  });

  it('should show resource counts next to kind labels', () => {
    render(
      <KindFilterDropdown
        filters={dropdownFilter}
        supportedKinds={supportedKinds}
        onChange={onChange}
        opened
      />,
    );

    expect(
      screen.getByText((content, element) => {
        const hasText = content.includes('Kind B') && content.includes('(3)');
        const isTarget = element?.tagName.toLowerCase() === 'span';
        return hasText && isTarget;
      }),
    ).toBeInTheDocument();
  });

  it('should call onChange when a kind is selected', async () => {
    const user = userEvent.setup();
    render(
      <KindFilterDropdown
        filters={dropdownFilter}
        supportedKinds={supportedKinds}
        onChange={onChange}
        opened
      />,
    );

    const checkbox = screen.getByRole('checkbox', { name: /kind-a/i });
    await user.click(checkbox);

    expect(onChange).toHaveBeenCalled();
  });
});
