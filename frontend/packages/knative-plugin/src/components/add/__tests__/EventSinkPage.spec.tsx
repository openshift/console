import * as React from 'react';
import { shallow } from 'enzyme';
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

const useEventSinkStatusMock = useEventSinkStatus as jest.Mock;

let eventSinkPageProps: React.ComponentProps<typeof EventSinkPage>;

describe('EventSinkPage', () => {
  beforeEach(() => {
    eventSinkPageProps = {
      history: null,
      location: {
        pathname: '/catalog/ns/my-app/eventsink?sinkKind=KameletBinding&name=log-sink',
        search: '/catalog/ns/my-app/eventsink?sinkKind=KameletBinding&name=log-sink',
        state: null,
        hash: null,
      },
      match: {
        isExact: true,
        path: '/catalog/ns/my-app/eventsink?sinkKind=KameletBinding&name=log-sink',
        url: '/catalog/ns/my-app/eventsink?sinkKind=KameletBinding&name=log-sink',
        params: {
          ns: 'my-app',
        },
      },
    };
  });

  it('should show loading if resource is not loaded yet', () => {
    useEventSinkStatusMock.mockReturnValue({ isValidSink: false, loaded: false });
    const wrapper = shallow(<EventSinkPage {...eventSinkPageProps} />);
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
    const wrapper = shallow(<EventSinkPage {...eventSinkPageProps} />);
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
    const wrapper = shallow(<EventSinkPage {...eventSinkPageProps} />);
    expect(wrapper.find(EventSinkAlert).exists()).toBe(true);
    expect(wrapper.find(EventSink).exists()).toBe(false);
    expect(wrapper.find(LoadingBox).exists()).toBe(false);
  });

  it('should render EventSink if resource is loaded and is valid for kafka sink', () => {
    const kafkaSinkPageProps = {
      history: null,
      location: {
        pathname: '/catalog/ns/my-app/eventsink?sinkKind=KafkaSink',
        search: '/catalog/ns/my-app/eventsink?sinkKind=KafkaSink',
        state: null,
        hash: null,
      },
      match: {
        isExact: true,
        path: '/catalog/ns/my-app/eventsink?sinkKind=KafkaSink',
        url: '/catalog/ns/my-app/eventsink?sinkKind=KafkaSink',
        params: {
          ns: 'my-app',
        },
      },
    };
    useEventSinkStatusMock.mockReturnValue({
      isValidSink: true,
      loaded: true,
      createSinkAccessLoading: false,
      createSinkAccess: true,
      normalizedSink: mockNormalizedKafkaSink,
      kamelet: null,
    });
    const wrapper = shallow(<EventSinkPage {...kafkaSinkPageProps} />);
    expect(wrapper.find(EventSink).exists()).toBe(true);
    expect(wrapper.find(EventSink).props().namespace).toEqual('my-app');
    expect(wrapper.find(EventSink).props().kameletSink).toBeNull();
    expect(wrapper.find(EventSinkAlert).exists()).toBe(false);
    expect(wrapper.find(LoadingBox).exists()).toBe(false);
  });
});
