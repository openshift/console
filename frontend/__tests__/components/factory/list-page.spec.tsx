import * as React from 'react';
// eslint-disable-next-line no-unused-vars
import { shallow, ShallowWrapper } from 'enzyme';

import { TextFilter, ListPageWrapper_, FireMan_, MultiListPage } from '../../../public/components/factory/list-page';
import { NavTitle, Dropdown, Firehose } from '../../../public/components/utils';
import { CheckBoxes } from '../../../public/components/row-filter';

describe(TextFilter.displayName, () => {
  let wrapper: ShallowWrapper;
  let label: string;
  let onChange: React.ChangeEventHandler<any>;
  let defaultValue: string;

  beforeEach(() => {
    label = 'Pods';
    onChange = () => null;
    defaultValue = '';
    wrapper = shallow(<TextFilter label={label} onChange={onChange} defaultValue={defaultValue} />);
  });

  it('renders text input', () => {
    const input: ShallowWrapper<React.InputHTMLAttributes<any>> = wrapper.find('input');

    expect(input.props().type).toEqual('text');
    expect(input.props().placeholder).toEqual(`Filter ${label}...`);
    expect(input.props().onChange).toEqual(onChange);
    expect(input.props().autoFocus).toEqual(true);
    expect(input.props().defaultValue).toEqual(defaultValue);
  });
});

describe(FireMan_.displayName, () => {
  let wrapper: ShallowWrapper<any>;

  beforeEach(() => {
    const resources = [{kind: 'nodes'}];
    wrapper = shallow(<FireMan_.WrappedComponent resources={resources} />);
  });

  it('renders `NavTitle` if given `title`', () => {
    expect(wrapper.find(NavTitle).exists()).toBe(false);

    const title = 'My pods';
    wrapper.setProps({title});

    expect(wrapper.find(NavTitle).props().title).toEqual(title);
  });

  it('renders create button if given `canCreate` true', () => {
    expect(wrapper.find('button#yaml-create').exists()).toBe(false);

    const createProps = {foo: 'bar'};
    const button = wrapper.setProps({canCreate: true, createProps, createButtonText: 'Create Me!'}).find('#yaml-create');

    expect(wrapper.find('#yaml-create').text()).toEqual('Create Me!');

    Object.keys(createProps).forEach((key) => {
      expect(createProps[key] === button.props()[key]).toBe(true);
    });
  });

  it('renders dropdown filters if given `dropdownFilters`', () => {
    const dropdownFilters = [{
      type: 'app-status',
      items: {
        all: 'Status: All',
        ready: 'Status: Ready',
        notReady: 'Status: Not Ready',
      },
      title: 'Ready Status',
    }];
    wrapper.setProps({dropdownFilters});

    const dropdowns = wrapper.find(Dropdown);

    expect(dropdowns.length).toEqual(dropdownFilters.length);
    dropdowns.forEach((dropdown, i) => {
      expect(dropdown.props().items).toEqual(dropdownFilters[i].items);
      expect(dropdown.props().title).toEqual(dropdownFilters[i].title);
    });
  });

  it('renders expand button if given `canExpand` true', () => {
    wrapper.setProps({canExpand: true});
    expect(wrapper.find('.co-m-pane__filter-bar-group').not('.co-m-pane__filter-bar-group--filter').childAt(0).dive().find('.compaction-btn').exists()).toBe(true);
  });

  it('renders `TextFilter` with given props', () => {
    const filterLabel = 'My filter';
    wrapper.setProps({filterLabel});
    const filter = wrapper.find(TextFilter);

    expect(filter.props().label).toEqual(filterLabel);
  });
});

describe(ListPageWrapper_.displayName, () => {
  const data: any[] = [
    {kind: 'Pod'},
    {kind: 'Pod'},
    {kind: 'Node'},
  ];
  const flatten = () => data;
  const ListComponent = () => <div />;
  const wrapper: ShallowWrapper = shallow(<ListPageWrapper_ flatten={flatten} ListComponent={ListComponent} kinds={['pods']} rowFilters={[]} />);

  it('renders row filters if given `rowFilters`', () => {
    const rowFilters = [{
      type: 'app-type',
      selected: ['database'],
      reducer: (item) => item.kind,
      items: [
        {id: 'database', title: 'Databases'},
        {id: 'loadbalancer', title: 'Load Balancers'}
      ]
    }];
    wrapper.setProps({rowFilters: rowFilters});
    const checkboxes = wrapper.find(CheckBoxes) as any;

    expect(checkboxes.length).toEqual(rowFilters.length);
    checkboxes.forEach((checkbox, i) => {
      expect(checkbox.props().items).toEqual(rowFilters[i].items);
      expect(checkbox.props().numbers).toEqual({ Pod: 2, Node: 1 });
      expect(checkbox.props().selected).toEqual(rowFilters[i].selected);
      expect(checkbox.props().type).toEqual(rowFilters[i].type);
    });
  });

  it('renders given `ListComponent`', () => {
    expect(wrapper.find(ListComponent).exists()).toBe(true);
  });
});

describe(MultiListPage.displayName, () => {
  const ListComponent = () => <div />;
  const wrapper: ShallowWrapper = shallow(<MultiListPage ListComponent={ListComponent} resources={[{
    kind: 'Pod',
    filterLabel: 'Pods by name',
  }]} />);

  it('renders a `Firehose` wrapped `ListPageWrapper_`', () => {
    expect(wrapper.find(Firehose).exists()).toBe(true);
  });
});
