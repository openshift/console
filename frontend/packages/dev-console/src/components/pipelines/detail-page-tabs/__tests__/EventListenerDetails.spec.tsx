import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import EventListenerDetails from '../EventListenerDetails';
import { EventlistenerTestData, EventlistenerTypes } from '../../../../test/event-listener-data';
import EventListenerTriggers from '../EventListenerTriggers';

type EventListenerDetailsProps = React.ComponentProps<typeof EventListenerDetails>;

describe('EventListener Details', () => {
  let wrapper: ShallowWrapper<EventListenerDetailsProps>;

  beforeEach(() => {
    wrapper = shallow(
      <EventListenerDetails
        obj={EventlistenerTestData[EventlistenerTypes.BINDINGS_TEMPLATE_NAME]}
      />,
    );
  });

  it('should not render EventListenerTriggers section if the trigger contains binding ref', () => {
    wrapper.setProps({ obj: EventlistenerTestData[EventlistenerTypes.BINDINGS_TEMPLATE_REF] });
    expect(wrapper.find(EventListenerTriggers).exists()).toBe(false);
  });

  it('should not render EventListenerTriggers section if triggers contains triggerRef', () => {
    wrapper.setProps({ obj: EventlistenerTestData[EventlistenerTypes.TRIGGER_REF] });
    expect(wrapper.find(EventListenerTriggers).exists()).toBe(false);
  });
});
