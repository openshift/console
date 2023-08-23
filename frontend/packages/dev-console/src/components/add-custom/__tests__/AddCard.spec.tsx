import * as React from 'react';
import { Title } from '@patternfly/react-core';
import { shallow, ShallowWrapper } from 'enzyme';
import AddCard from '../AddCard';
import { addActionExtensions } from './add-page-test-data';

describe('AddCard', () => {
  type AddCardProps = React.ComponentProps<typeof AddCard>;
  let props: AddCardProps;
  let wrapper: ShallowWrapper<AddCardProps>;

  beforeEach(() => {
    props = {
      id: 'id',
      title: 'Title',
      items: addActionExtensions,
      namespace: 'ns',
    };
  });

  it('should render null if no items are passed', () => {
    wrapper = shallow(<AddCard {...props} items={[]} />);
    expect(wrapper.isEmptyRender()).toBe(true);
  });

  it('should render add group title if there are more than one items', () => {
    wrapper = shallow(<AddCard {...props} />);
    expect(wrapper.find(Title).exists()).toBe(true);
  });

  it('should render add group title if there is only one item but its label does not match the add group title', () => {
    props = { ...props, items: [addActionExtensions[0]] };
    expect(wrapper.find(Title).exists()).toBe(true);
  });

  it('should not render add group title if there is only one item and its label matches the add group title', () => {
    const addAction = addActionExtensions[0];
    props = { ...props, items: [addAction], title: addAction.properties.label };
    wrapper = shallow(<AddCard {...props} />);
    expect(wrapper.find(Title).exists()).toBe(false);
  });
});
