import * as React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { Provider } from 'react-redux';
import store from '@console/internal/redux';
import * as utils from '@console/internal/components/utils/url-poll-hook';
import DataModelProvider from '../data-transforms/DataModelProvider';
import { TopologyDataRetriever } from '../TopologyDataRetriever';
import { TopologyPageContext } from '../TopologyPage';

jest.mock('@console/plugin-sdk/src/api/useExtensions', () => ({
  useExtensions: () => [],
}));
jest.mock('@console/shared', () => {
  const ActualShared = require.requireActual('@console/shared');
  return {
    ...ActualShared,
    useQueryParams: () => new Map(),
  };
});

type Props = {
  className?: string;
};

describe('DataModelProvider', () => {
  let wrapper: ReactWrapper<Props>;
  const spyUseURLPoll = jest.spyOn(utils, 'useURLPoll');
  const match = {
    params: {
      name: 'topology-test',
    },
    isExact: true,
    path: '/topology/ns/topology-test/graph',
    url: '',
  };

  beforeEach(() => {
    spyUseURLPoll.mockReturnValue([{}, null, false]);
    wrapper = mount(
      <DataModelProvider namespace="test-project">
        <TopologyPageContext match={match} />
      </DataModelProvider>,
      {
        wrappingComponent: ({ children }) => <Provider store={store}>{children}</Provider>,
      },
    );
  });

  it('should render inner components', () => {
    expect(wrapper.find(TopologyDataRetriever)).toHaveLength(1);
    expect(wrapper.find(TopologyPageContext)).toHaveLength(1);
  });
});
