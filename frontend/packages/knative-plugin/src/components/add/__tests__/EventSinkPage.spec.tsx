import * as React from 'react';
import { shallow } from 'enzyme';
// import { BrowserRouter } from 'react-router-dom';
import * as Router from 'react-router-dom-v5-compat';
import { LoadingBox } from '@console/internal/components/utils';
import { useEventSinkStatus } from '../../../hooks/useEventSinkStatus';
import {
  mockKameletSink,
  mockNormalizedKafkaSink,
  mockNormalizedSink,
} from '../__mocks__/Kamelet-data';
import EventSink from '../EventSink';
import EventSinkAlert from '../EventSinkAlert';
import EventSinkPage from '../EventSinkPage';

jest.mock('../../../hooks/useEventSinkStatus', () => ({
  useEventSinkStatus: jest.fn(),
}));

jest.mock('react-router-dom-v5-compat', () => ({
  ...require.requireActual('react-router-dom-v5-compat'),
  useParams: jest.fn(),
  useLocation: jest.fn(),
}));

const useEventSinkStatusMock = useEventSinkStatus as jest.Mock;

describe('EventSinkPage', () => {
  beforeEach(() => {
    jest.spyOn(Router, 'useParams').mockReturnValue({
      ns: 'my-app',
    });
    jest.spyOn(Router, 'useLocation').mockReturnValue({
      pathname: '/catalog/ns/my-app/eventsink?sinkKind=KameletBinding&name=log-sink',
      search: '/catalog/ns/my-app/eventsink?sinkKind=KameletBinding&name=log-sink',
      state: null,
      hash: null,
    });
  });

  it('should show loading if resource is not loaded yet', () => {
    useEventSinkStatusMock.mockReturnValue({ isValidSink: false, loaded: false });
    const wrapper = shallow(<EventSinkPage />);
    expect(wrapper.find(LoadingBox).exists()).toBe(true);
    expect(wrapper.find(EventSinkAlert).exists()).toBe(false);
    expect(wrapper.find(EventSink).exists()).toBe(false);
  });

  it('should render EventSink if resource is loaded and is valid', () => {
    useEventSinkStatusMock.mockReturnValue({
      isValidSink: true,
      loaded: true,
      createSinkAccessLoading: false,
      createSinkAccess: true,
      normalizedSink: mockNormalizedSink,
      kamelet: mockKameletSink,
    });
    const wrapper = shallow(<EventSinkPage />);
    expect(wrapper.find(EventSink).exists()).toBe(true);
    expect(wrapper.find(EventSinkAlert).exists()).toBe(false);
    expect(wrapper.find(LoadingBox).exists()).toBe(false);
  });

  it('should render EventSinkAlert if resource is loaded but user doesnot have create access', () => {
    useEventSinkStatusMock.mockReturnValue({
      isValidSink: true,
      loaded: true,
      createSinkAccessLoading: false,
      createSinkAccess: false,
      normalizedSink: mockNormalizedSink,
      kamelet: mockKameletSink,
    });
    const wrapper = shallow(<EventSinkPage />);
    expect(wrapper.find(EventSinkAlert).exists()).toBe(true);
    expect(wrapper.find(EventSink).exists()).toBe(false);
    expect(wrapper.find(LoadingBox).exists()).toBe(false);
  });

  it('should render EventSink if resource is loaded and is valid for kafka sink', () => {
    useEventSinkStatusMock.mockReturnValue({
      isValidSink: true,
      loaded: true,
      createSinkAccessLoading: false,
      createSinkAccess: true,
      normalizedSink: mockNormalizedKafkaSink,
      kamelet: null,
    });
    jest.spyOn(Router, 'useParams').mockReturnValue({
      ns: 'my-app',
    });
    jest.spyOn(Router, 'useLocation').mockReturnValue({
      pathname: '/catalog/ns/my-app/eventsink?sinkKind=KafkaSink',
      search: '/catalog/ns/my-app/eventsink?sinkKind=KafkaSink',
      state: null,
      hash: null,
    });
    const wrapper = shallow(<EventSinkPage />);
    expect(wrapper.find(EventSink).exists()).toBe(true);
    expect(wrapper.find(EventSink).props().namespace).toEqual('my-app');
    expect(wrapper.find(EventSink).props().kameletSink).toBeNull();
    expect(wrapper.find(EventSinkAlert).exists()).toBe(false);
    expect(wrapper.find(LoadingBox).exists()).toBe(false);
  });
});

// describe('servicebinding', () => {
//   it('', () => {});
// });
