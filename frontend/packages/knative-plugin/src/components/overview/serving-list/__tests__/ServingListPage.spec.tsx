import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { NamespaceBar } from '@console/internal/components/namespace';
import { MultiTabListPage } from '@console/shared';
import ServingListPage from '../ServingListsPage';
import { RevisionModel } from '../../../../models';

let servingListPageProps: React.ComponentProps<typeof ServingListPage>;
let wrapper: ShallowWrapper;

describe('ServingListPage', () => {
  beforeEach(() => {
    servingListPageProps = {
      match: {
        isExact: true,
        path: `/serving/ns/:ns/${RevisionModel.plural}`,
        url: 'serving/ns/my-project/revisions',
        params: {
          ns: 'my-project',
        },
      },
    };
    wrapper = shallow(<ServingListPage {...servingListPageProps} />);
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
