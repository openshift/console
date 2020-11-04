import * as React from 'react';
import { shallow } from 'enzyme';
import { Alert } from '@patternfly/react-core';
import { referenceForModel } from '@console/internal/module/k8s';
import EventSourceAlert from '../EventSourceAlert';
import { getEventSourceIcon } from '../../../utils/get-knative-icon';
import { EventSourceContainerModel } from '../../../models';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

describe('EventSourceAlert', () => {
  const eventSourceStatusData = {
    loaded: true,
    eventSourceList: {
      [EventSourceContainerModel.kind]: {
        name: EventSourceContainerModel.kind,
        title: EventSourceContainerModel.kind,
        iconUrl: getEventSourceIcon(referenceForModel(EventSourceContainerModel)),
        displayName: EventSourceContainerModel.kind,
      },
    },
  };

  it('should not alert if eventSources are there', () => {
    const wrapper = shallow(<EventSourceAlert eventSourceStatus={eventSourceStatusData} />);
    expect(wrapper.find(Alert).exists()).toBe(false);
  });

  it('should show alert if eventSources is null', () => {
    const wrapper = shallow(
      <EventSourceAlert eventSourceStatus={{ loaded: true, eventSourceList: null }} />,
    );
    expect(wrapper.find(Alert).exists()).toBe(true);
  });

  it('should show alert if eventSources has loaded with no data', () => {
    const eventSourceStatus = { loaded: true, eventSourceList: {} };
    const wrapper = shallow(<EventSourceAlert eventSourceStatus={eventSourceStatus} />);
    expect(wrapper.find(Alert).exists()).toBe(true);
  });

  it('should not alert if  eventSources has not loaded', () => {
    const eventSourceStatus = { loaded: false, eventSourceList: {} };
    const wrapper = shallow(<EventSourceAlert eventSourceStatus={eventSourceStatus} />);
    expect(wrapper.find(Alert).exists()).toBe(false);
  });
});
