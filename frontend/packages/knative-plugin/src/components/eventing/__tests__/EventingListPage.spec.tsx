import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import * as Router from 'react-router-dom-v5-compat';
import { NamespaceBar } from '@console/internal/components/namespace-bar';
import { MultiTabListPage } from '@console/shared';
import EventingListPage from '../EventingListPage';

jest.mock('react-router-dom-v5-compat', () => ({
  ...require.requireActual('react-router-dom-v5-compat'),
  useParams: jest.fn(),
}));

let wrapper: ShallowWrapper;

describe('EventingListPage', () => {
  beforeEach(() => {
    jest.spyOn(Router, 'useParams').mockReturnValue({
      ns: 'my-project',
    });
    wrapper = shallow(<EventingListPage />);
  });

  it('should render NamespaceBar and MultiTabListPage', () => {
    expect(wrapper.find(NamespaceBar)).toHaveLength(1);
    expect(wrapper.find(MultiTabListPage)).toHaveLength(1);
  });

  it('should render MultiTabListPage with all pages and menuActions', () => {
    const multiTablistPage = wrapper.find(MultiTabListPage);
    expect(multiTablistPage.props().title).toEqual('Eventing');
    expect(multiTablistPage.props().pages).toHaveLength(5);
    expect(Object.keys(multiTablistPage.props().menuActions)).toHaveLength(3);
    expect(multiTablistPage.props().menuActions.eventSource).toBeDefined();
  });

  it('should show correct url for creation for valid namespace', () => {
    wrapper = shallow(<EventingListPage />);
    const multiTablistPage = wrapper.find(MultiTabListPage);
    expect(Object.keys(multiTablistPage.props().menuActions)).toHaveLength(3);
    expect(multiTablistPage.props().menuActions.eventSource).toBeDefined();
    expect(
      multiTablistPage
        .props()
        .menuActions.eventSource.onSelection('eventSource', { label: 'Event Source' }, undefined),
    ).toEqual('/catalog/ns/my-project?catalogType=EventSource&provider=["Red+Hat"]');
  });

  it('should show correct url for creation if namespace is not defined', () => {
    jest.spyOn(Router, 'useParams').mockReturnValue({
      ns: undefined,
    });
    wrapper = shallow(<EventingListPage />);
    const multiTablistPage = wrapper.find(MultiTabListPage);
    expect(Object.keys(multiTablistPage.props().menuActions)).toHaveLength(3);
    expect(multiTablistPage.props().menuActions.eventSource).toBeDefined();
    expect(
      multiTablistPage
        .props()
        .menuActions.eventSource.onSelection('eventSource', { label: 'Event Source' }, undefined),
    ).toEqual('/catalog/ns/default?catalogType=EventSource&provider=["Red+Hat"]');
  });
});
