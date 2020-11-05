import * as React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { Provider } from 'react-redux';
import store from '@console/internal/redux';
import * as utils from '@console/internal/components/utils/url-poll-hook';
import DataModelProvider from '../data-transforms/DataModelProvider';
import { TopologyDataRetriever } from '../TopologyDataRetriever';
import { TopologyDataRenderer } from '../TopologyDataRenderer';

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
jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

type Props = {
  className?: string;
};

describe('DataModelProvider', () => {
  let wrapper: ReactWrapper<Props>;
  const spyUseURLPoll = jest.spyOn(utils, 'useURLPoll');

  beforeEach(() => {
    spyUseURLPoll.mockReturnValue([{}, null, false]);
    wrapper = mount(
      <DataModelProvider namespace="test-project">
        <TopologyDataRenderer showGraphView title="Topology" />
      </DataModelProvider>,
      {
        wrappingComponent: ({ children }) => <Provider store={store}>{children}</Provider>,
      },
    );
  });

  it('should render inner components', () => {
    expect(wrapper.find(TopologyDataRetriever)).toHaveLength(1);
    expect(wrapper.find(TopologyDataRenderer)).toHaveLength(1);
  });
});
