/* eslint-disable no-unused-vars */

import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { Map } from 'immutable';

import { TextFilter, BaseListPage, ListPage, MultiListPage } from '../../../public/components/factory/list-page';
import { NavTitle, Dropdown, Firehose, MultiFirehose } from '../../../public/components/utils';
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

describe(BaseListPage.displayName, () => {
  let wrapper: ShallowWrapper<any>;
  let data: any[];
  const ListComponent = () => <div />;

  beforeEach(() => {
    data = [
      {kind: 'Pod'},
      {kind: 'Pod'},
      {kind: 'Node'},
    ];
    // FIXME(alecmerdler): Remove this once https://github.com/DefinitelyTyped/DefinitelyTyped/pull/19672 is shipped
    const Component = (BaseListPage as any).WrappedComponent;
    wrapper = shallow(<Component loaded={true} data={data} ListComponent={ListComponent} />);
  });

  it('renders `NavTitle` if given `title`', () => {
    expect(wrapper.find(NavTitle).exists()).toBe(false);

    const title = 'My pods';
    wrapper.setProps({title});
    
    expect(wrapper.find(NavTitle).props().title).toEqual(title);
  });

  it('renders `Intro` if given', () => {
    const Intro = <h1 className="co-m-intro">My Intro</h1>;

    expect(wrapper.contains(Intro)).toBe(false);

    wrapper.setProps({Intro});

    expect(wrapper.contains(Intro)).toBe(true);
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

  it('does not render create button if loading or load error', () => {
    wrapper.setProps({canCreate: true, createProps: {}, loaded: false});

    expect(wrapper.find('#yaml-create').exists()).toBe(false);

    wrapper.setProps({canCreate: true, createProps: {}, loaded: true, loadError: 'an error occurred'});

    expect(wrapper.find('#yaml-create').exists()).toBe(false);
  });

  it('renders expand button if given `canExpand` true', () => {
    const button = wrapper.find('.co-m-pane__heading').find('.col-xs-12').childAt(0);
    expect(button.dive().find('.compaction-btn').exists()).toBe(false);

    wrapper.setProps({canExpand: true});

    expect(wrapper.find('.co-m-pane__heading').find('.col-xs-12').childAt(0).dive().find('.compaction-btn').exists()).toBe(true);
  });

  it('renders `TextFilter` with given props', () => {
    const filterLabel = 'My filter';
    wrapper.setProps({filterLabel});
    const filter = wrapper.find(TextFilter);

    expect(filter.props().label).toEqual(filterLabel);
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
    const checkboxes = wrapper.find(CheckBoxes);

    expect(checkboxes.length).toEqual(rowFilters.length);
    checkboxes.forEach((checkbox, i) => {
      const expectedNumbers = data.reduce((acc, item) => acc.update(item.kind, 0, (value) => value + 1), Map<string, number>());

      expect(checkbox.props().items).toEqual(rowFilters[i].items);
      expect(checkbox.props().numbers).toEqual(expectedNumbers.toJS());
      expect(checkbox.props().selected).toEqual(rowFilters[i].selected);
      expect(checkbox.props().type).toEqual(rowFilters[i].type);
    });
  });

  it('renders given `ListComponent`', () => {
    expect(wrapper.find(ListComponent).exists()).toBe(true);
  });
});

describe(ListPage.displayName, () => {
  let wrapper: ShallowWrapper;
  const ListComponent = () => <div />;

  beforeEach(() => {
    wrapper = shallow(<ListPage ListComponent={ListComponent} kind="Pod" filterLabel="Pods by name" />);
  });

  it('renders a `Firehose` wrapped `BaseListPage`', () => {
    expect(wrapper.find(Firehose).exists()).toBe(true);
    expect(wrapper.find(BaseListPage).exists()).toBe(true);
  });
});

describe(MultiListPage.displayName, () => {
  let wrapper: ShallowWrapper;
  let resources: any[];

  beforeEach(() => {
    resources = [
      {kind: 'Pod', namespaced: true},
      {kind: 'Node', namespaced: true},
    ];
    // FIXME(alecmerdler): Remove this once https://github.com/DefinitelyTyped/DefinitelyTyped/pull/19672 is shipped
    const Component = (MultiListPage as any).WrappedComponent;
    wrapper = shallow(<Component resources={resources} ns="default" />);
  });

  it('renders a `MultiFirehose` wrapped `BaseListPage`', () => {
    const multiFirehose = wrapper.find(MultiFirehose);
    const listPage: ShallowWrapper<any> = wrapper.find(BaseListPage);

    expect(multiFirehose.props().resources).toEqual(resources.map(({kind}) => ({kind: kind, namespace: 'default', prop: kind, isList: true})));
    expect(listPage.props().kinds).toEqual(resources.map(({kind}) => kind));
  });
});
