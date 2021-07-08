import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import {
  EventlistenerTestData,
  EventlistenerTypes,
} from '../../../../test-data/event-listener-data';
import EventListenerDetails from '../EventListenerDetails';
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

  it('should render EventListenerTriggers section if the trigger contains binding & template.name', () => {
    wrapper.setProps({ obj: EventlistenerTestData[EventlistenerTypes.BINDINGS_TEMPLATE_NAME] });
    expect(wrapper.find(EventListenerTriggers).exists()).toBe(true);
  });

  it('should render EventListenerTriggers section if the trigger contains binding & template.ref', () => {
    wrapper.setProps({ obj: EventlistenerTestData[EventlistenerTypes.BINDINGS_TEMPLATE_REF] });
    expect(wrapper.find(EventListenerTriggers).exists()).toBe(true);
  });

  it('should not render EventListenerTriggers section if triggers contains triggerRef', () => {
    wrapper.setProps({ obj: EventlistenerTestData[EventlistenerTypes.TRIGGER_REF] });
    expect(wrapper.find(EventListenerTriggers).exists()).toBe(false);
  });
});
