import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import { shallow } from 'enzyme';
import EventSinkAlert from '../EventSinkAlert';

describe('EventSinkAlert', () => {
  it('should not alert if eventSinks are there', () => {
    const wrapper = shallow(
      <EventSinkAlert isValidSink createSinkAccessLoading={false} createSinkAccess />,
    );
    expect(wrapper.find(Alert).exists()).toBe(false);
  });

  it('should show alert if eventSink is present but do not have create access', () => {
    const wrapper = shallow(
      <EventSinkAlert isValidSink createSinkAccessLoading={false} createSinkAccess={false} />,
    );
    expect(wrapper.find(Alert).exists()).toBe(true);
  });

  it('should show alert if eventSink is not present', () => {
    const wrapper = shallow(
      <EventSinkAlert
        isValidSink={false}
        createSinkAccessLoading={false}
        createSinkAccess={false}
      />,
    );
    expect(wrapper.find(Alert).exists()).toBe(true);
  });
});
