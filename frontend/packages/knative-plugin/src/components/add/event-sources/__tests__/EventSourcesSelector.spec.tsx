import * as React from 'react';
import * as lodash from 'lodash';
import { shallow, ShallowWrapper } from 'enzyme';
import { ItemSelectorField } from '@console/shared';
import EventSourcesSelector from '../EventSourcesSelector';
import * as sourceUtils from '../../../../utils/create-eventsources-utils';

type EventSourcesSelectorProps = React.ComponentProps<typeof EventSourcesSelector>;

jest.mock('formik', () => ({
  useField: jest.fn(() => [{}, {}]),
  useFormikContext: jest.fn(() => ({
    setFieldValue: jest.fn(),
    setFieldTouched: jest.fn(),
    validateForm: jest.fn(),
    values: {
      type: 'SinkBinding',
      name: 'sink-binding',
    },
  })),
  getFieldId: jest.fn(),
}));
describe('EventSourcesSelector', () => {
  let wrapper: ShallowWrapper<EventSourcesSelectorProps>;
  beforeEach(() => {
    const eventSourceList = {};
    wrapper = shallow(<EventSourcesSelector eventSourceList={eventSourceList} />);
  });

  it('should render ItemSelectorField', () => {
    expect(wrapper.find(ItemSelectorField)).toHaveLength(1);
    expect(wrapper.find(ItemSelectorField).props().itemList).toEqual({});
  });

  it('should have loadingItems as true if items are not there', () => {
    expect(wrapper.find(ItemSelectorField).props().loadingItems).toBe(true);
  });

  it('should have loadingItems as false if items are there', () => {
    const eventSourceList = {
      SinkBinding: {
        title: 'sinkBinding',
        iconUrl: 'sinkBindingIcon',
        name: 'SinkBinding',
        displayName: 'Sink Binding',
      },
    };
    wrapper = shallow(<EventSourcesSelector eventSourceList={eventSourceList} />);
    expect(wrapper.find(ItemSelectorField).props().loadingItems).toBe(false);
  });

  it('should call getEventSourceData onSelect', () => {
    const spyGetEventSourceData = jest.spyOn(sourceUtils, 'getEventSourceData');
    const spyKebabCase = jest.spyOn(lodash, 'kebabCase');
    wrapper
      .find(ItemSelectorField)
      .props()
      .onSelect('ApiServerSource');
    expect(spyGetEventSourceData).toHaveBeenCalledWith('apiserversource');
    expect(spyKebabCase).toHaveBeenCalledWith('ApiServerSource');
  });
});
