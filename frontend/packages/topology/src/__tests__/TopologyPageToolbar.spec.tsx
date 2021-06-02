import * as React from 'react';
import { Button, Tooltip } from '@patternfly/react-core';
import { shallow } from 'enzyme';
import TopologyPageToolbar from '../components/page/TopologyPageToolbar';
import { TopologyViewType } from '../topology-types';

jest.mock('react', () => {
  const ActualReact = require.requireActual('react');
  return {
    ...ActualReact,
    useContext: () => jest.fn(),
  };
});

jest.mock('react-redux', () => {
  const ActualReactRedux = require.requireActual('react-redux');
  return {
    ...ActualReactRedux,
    useSelector: jest.fn(),
    useDispatch: jest.fn(),
  };
});

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
    useTranslation: () => ({ t: (key: string) => key }),
  };
});

describe('TopologyPageToolbar tests', () => {
  it('should render view shortcuts button on topology page toolbar', () => {
    const mockViewChange = jest.fn();
    spyOn(React, 'useContext').and.returnValue({
      isEmptyModel: false,
      namespace: 'test-namespace',
    });
    const wrapper = shallow(
      <TopologyPageToolbar viewType={TopologyViewType.graph} onViewChange={mockViewChange} />,
    );
    expect(wrapper.find('[data-test-id="topology-view-shortcuts"]').exists()).toBe(true);
  });

  it('should render view shortcuts button on topology list page toolbar', () => {
    const mockViewChange = jest.fn();
    spyOn(React, 'useContext').and.returnValue({
      isEmptyModel: false,
      namespace: 'test-namespace',
    });
    const wrapper = shallow(
      <TopologyPageToolbar viewType={TopologyViewType.list} onViewChange={mockViewChange} />,
    );
    expect(wrapper.find('[data-test-id="topology-view-shortcuts"]').exists()).toBe(true);
  });

  it('should show the topology icon when on topology list page', () => {
    const mockViewChange = jest.fn();
    spyOn(React, 'useContext').and.returnValue({
      isEmptyModel: false,
      namespace: 'test-namespace',
    });
    const wrapper = shallow(
      <TopologyPageToolbar viewType={TopologyViewType.list} onViewChange={mockViewChange} />,
    );
    expect(wrapper.find(Tooltip).props().content).toBe('topology~Graph view');
  });

  it('should show the topology list icon when on topology page', () => {
    const mockViewChange = jest.fn();
    spyOn(React, 'useContext').and.returnValue({
      isEmptyModel: false,
      namespace: 'test-namespace',
    });
    const wrapper = shallow(
      <TopologyPageToolbar viewType={TopologyViewType.graph} onViewChange={mockViewChange} />,
    );
    expect(wrapper.find(Tooltip).props().content).toBe('topology~List view');
  });

  it('should not contain view switcher when when no project is selected', () => {
    const mockViewChange = jest.fn();
    spyOn(React, 'useContext').and.returnValue({
      isEmptyModel: false,
      namespace: undefined,
    });
    const wrapper = shallow(
      <TopologyPageToolbar viewType={TopologyViewType.graph} onViewChange={mockViewChange} />,
    );
    expect(wrapper.find(Button).exists()).toBe(false);
  });

  it('should disable view switcher when no model', () => {
    const mockViewChange = jest.fn();
    spyOn(React, 'useContext').and.returnValue({
      isEmptyModel: true,
      namespace: 'test-namespace',
    });
    const wrapper = shallow(
      <TopologyPageToolbar viewType={TopologyViewType.graph} onViewChange={mockViewChange} />,
    );
    const switcher = wrapper.find(Button);
    expect(switcher.at(1).props().isDisabled).toBe(true);
  });
});
