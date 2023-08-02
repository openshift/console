import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import * as Router from 'react-router-dom-v5-compat';
import { NamespaceBar } from '@console/internal/components/namespace-bar';
import { MultiTabListPage } from '@console/shared';
import ServingListPage from '../ServingListsPage';

let wrapper: ShallowWrapper;

jest.mock('react-router-dom-v5-compat', () => ({
  ...require.requireActual('react-router-dom-v5-compat'),
  useParams: jest.fn(),
}));

describe('ServingListPage', () => {
  beforeEach(() => {
    jest.spyOn(Router, 'useParams').mockReturnValue({
      ns: 'my-project',
    });
    wrapper = shallow(<ServingListPage />);
  });

  it('should render NamespaceBar and MultiTabListPage', () => {
    expect(wrapper.find(NamespaceBar)).toHaveLength(1);
    expect(wrapper.find(MultiTabListPage)).toHaveLength(1);
  });

  it('should render MultiTabListPage with all pages and menuActions', () => {
    const multiTablistPage = wrapper.find(MultiTabListPage);
    expect(multiTablistPage.props().title).toEqual('Serving');
    expect(multiTablistPage.props().pages).toHaveLength(3);
    expect(Object.keys(multiTablistPage.props().menuActions)).toHaveLength(1);
    expect(multiTablistPage.props().menuActions.service).toBeDefined();
  });
});
