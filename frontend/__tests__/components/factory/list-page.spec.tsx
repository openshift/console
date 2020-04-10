import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import {
  TextFilter,
  ListPageWrapper_,
  FireMan_,
  MultiListPage,
} from '../../../public/components/factory/list-page';
import { Firehose, PageHeading } from '../../../public/components/utils';

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
    expect(input.props().defaultValue).toEqual(defaultValue);
  });
});

describe(FireMan_.displayName, () => {
  let wrapper: ShallowWrapper<any>;

  beforeEach(() => {
    const resources = [{ kind: 'Node' }];
    wrapper = shallow(<FireMan_.WrappedComponent resources={resources} />);
  });

  it('renders `PageHeading` if given `title`', () => {
    expect(wrapper.find(PageHeading).exists()).toBe(false);

    const title = 'My pods';
    wrapper.setProps({ title });

    expect(wrapper.find(PageHeading).props().title).toEqual(title);
  });

  it('renders create button if given `canCreate` true', () => {
    expect(wrapper.find('button#yaml-create').exists()).toBe(false);

    const createProps = { foo: 'bar' };
    const button = wrapper
      .setProps({ canCreate: true, createProps, createButtonText: 'Create Me!' })
      .find('#yaml-create');

    expect(
      wrapper
        .find('#yaml-create')
        .childAt(0)
        .text(),
    ).toEqual('Create Me!');

    Object.keys(createProps).forEach((key) => {
      expect(createProps[key] === button.props()[key]).toBe(true);
    });
  });
});

describe(ListPageWrapper_.displayName, () => {
  const data: any[] = [{ kind: 'Pod' }, { kind: 'Pod' }, { kind: 'Node' }];
  const flatten = () => data;
  const ListComponent = () => <div />;
  const wrapper: ShallowWrapper = shallow(
    <ListPageWrapper_
      flatten={flatten}
      ListComponent={ListComponent}
      kinds={['pods']}
      rowFilters={[]}
    />,
  );

  it('renders row filters if given `rowFilters`', () => {
    const rowFilters = [
      {
        type: 'app-type',
        reducer: (item) => item.kind,
        items: [
          { id: 'database', title: 'Databases' },
          { id: 'loadbalancer', title: 'Load Balancers' },
        ],
      },
    ];
    wrapper.setProps({ rowFilters });
    const dropdownFilter = wrapper.find('FilterToolbar') as any;
    expect(dropdownFilter.props().rowFilters).toEqual(rowFilters);
  });

  it('renders given `ListComponent`', () => {
    expect(wrapper.find(ListComponent).exists()).toBe(true);
  });
});

describe(MultiListPage.displayName, () => {
  const ListComponent = () => <div />;
  const wrapper: ShallowWrapper = shallow(
    <MultiListPage
      ListComponent={ListComponent}
      resources={[
        {
          kind: 'Pod',
          filterLabel: 'by name',
        },
      ]}
    />,
  );

  it('renders a `Firehose` wrapped `ListPageWrapper_`', () => {
    expect(wrapper.find(Firehose).exists()).toBe(true);
  });
});
