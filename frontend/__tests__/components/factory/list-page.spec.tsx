import * as React from 'react';
import { shallow, mount, ShallowWrapper, ReactWrapper } from 'enzyme';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import configureMockStore from 'redux-mock-store';
import { Provider } from 'react-redux';
import { TextInput } from '@patternfly/react-core';
import {
  TextFilter,
  ListPageWrapper,
  FireMan,
  MultiListPage,
} from '../../../public/components/factory/list-page';
import { Firehose } from '../../../public/components/utils';

jest.mock('react-redux', () => {
  const ActualReactRedux = jest.requireActual('react-redux');
  return {
    ...ActualReactRedux,
    useDispatch: jest.fn(),
  };
});

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

describe(TextFilter.displayName, () => {
  let wrapper: ReactWrapper;
  let placeholder: string;
  let onChange: (event: React.FormEvent<HTMLInputElement>, value: string) => void;
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
  const mockStore = configureMockStore();
  const store = mockStore({
    k8s: {
      getIn: jest.fn().mockReturnValue({}),
    },
    sdkCore: {
      impersonate: {},
    },
  });

  it('renders `title` if given `title`', () => {
    const { rerender } = render(
      <Provider store={store}>
        <FireMan resources={[{ kind: 'Node', prop: 'obj' }]} />
      </Provider>,
    );
    expect(screen.queryByText('My pods')).not.toBeInTheDocument();

    rerender(
      <Provider store={store}>
        <FireMan resources={[{ kind: 'Node', prop: 'obj' }]} title="My pods" />
      </Provider>,
    );
    expect(screen.getByText('My pods')).toBeInTheDocument();
  });

  it('renders create button if given `canCreate` true', () => {
    const createProps = {};
    render(
      <Provider store={store}>
        <FireMan
          resources={[{ kind: 'Node', prop: 'obj' }]}
          canCreate
          createProps={createProps}
          createButtonText="Create Me!"
          title="Nights Watch"
        />
      </Provider>,
    );

    const button = screen.getByRole('button', { name: 'Create Me!' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('id', 'yaml-create');
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
