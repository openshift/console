import * as React from 'react';
import { shallow, mount, ShallowWrapper, ReactWrapper } from 'enzyme';
import { TextInput } from '@patternfly/react-core';
import {
  TextFilter,
  ListPageWrapper,
  FireMan,
  MultiListPage,
} from '../../../public/components/factory/list-page';
import { Firehose, FirehoseResource, PageHeading } from '../../../public/components/utils';
import { NodeModel } from '../../../public/models';

jest.mock('react-redux', () => {
  const ActualReactRedux = jest.requireActual('react-redux');
  return {
    ...ActualReactRedux,
    useDispatch: jest.fn(),
  };
});

describe(TextFilter.displayName, () => {
  let wrapper: ReactWrapper;
  let placeholder: string;
  let onChange: (value: string, event: React.FormEvent<HTMLInputElement>) => void;
  let defaultValue: string;

  it('renders text input without label', () => {
    onChange = () => null;
    defaultValue = '';
    wrapper = mount(<TextFilter onChange={onChange} defaultValue={defaultValue} />);

    const input = wrapper.find(TextInput);

    expect(input.props().type).toEqual('text');
    expect(input.props().placeholder).toEqual('Filter ...');
    expect(input.props().onChange).toEqual(onChange);
    expect(input.props().defaultValue).toEqual(defaultValue);
  });

  it('renders text input with label', () => {
    onChange = () => null;
    defaultValue = '';
    wrapper = mount(
      <TextFilter label="resource" onChange={onChange} defaultValue={defaultValue} />,
    );

    const input = wrapper.find(TextInput);

    expect(input.props().type).toEqual('text');
    expect(input.props().placeholder).toEqual('Filter resource...');
    expect(input.props().onChange).toEqual(onChange);
    expect(input.props().defaultValue).toEqual(defaultValue);
  });

  it('renders text input with custom placeholder', () => {
    placeholder = 'Pods';
    onChange = () => null;
    defaultValue = '';
    wrapper = mount(
      <TextFilter placeholder={placeholder} onChange={onChange} defaultValue={defaultValue} />,
    );

    const input = wrapper.find(TextInput);

    expect(input.props().type).toEqual('text');
    expect(input.props().placeholder).toEqual(placeholder);
    expect(input.props().onChange).toEqual(onChange);
    expect(input.props().defaultValue).toEqual(defaultValue);
  });
});

describe(FireMan.displayName, () => {
  let wrapper: ShallowWrapper<any>;
  const Component: React.ComponentType<any> = Firehose.WrappedComponent as any;

  beforeEach(() => {
    const resources: FirehoseResource[] = [{ kind: NodeModel.kind, prop: 'Node' }];
    wrapper = shallow(<Component resources={resources} />);
  });

  it('renders `title` if given `title`', () => {
    expect(wrapper.find(PageHeading).props().title).toBe(undefined);

    const title = 'My pods';
    wrapper.setProps({ title });

    expect(wrapper.find(PageHeading).props().title).toEqual(title);
  });

  it('renders create button if given `canCreate` true', () => {
    expect(wrapper.find('button#yaml-create').exists()).toBe(false);

    const createProps = { foo: 'bar' };
    const button = wrapper
      .setProps({
        canCreate: true,
        createProps,
        createButtonText: 'Create Me!',
        title: 'Nights Watch',
      })
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

describe(ListPageWrapper.displayName, () => {
  const data: any[] = [{ kind: 'Pod' }, { kind: 'Pod' }, { kind: 'Node' }];
  const flatten = () => data;
  const ListComponent = () => <div />;
  const wrapper: ShallowWrapper = shallow(
    <ListPageWrapper
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
        },
      ]}
      filterLabel="by name"
    />,
  );

  it('renders a `Firehose` wrapped `ListPageWrapper_`', () => {
    expect(wrapper.find(Firehose).exists()).toBe(true);
  });
});
