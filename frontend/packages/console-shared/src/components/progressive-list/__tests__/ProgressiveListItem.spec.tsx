import * as React from 'react';
import { shallow } from 'enzyme';
import ProgressiveListItem from '../ProgressiveListItem';

const DummyComponent: React.FC = () => <div id="dummy">Dummy Component</div>;

describe(ProgressiveListItem.displayName, () => {
  let wrapper;
  beforeEach(() => {
    wrapper = shallow(
      <ProgressiveListItem name="Dummy">
        <DummyComponent />
      </ProgressiveListItem>,
    );
  });
  it('component should exist', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('should render the child component correctly', () => {
    expect(wrapper.find('div').text()).toEqual('<DummyComponent />');
    expect(wrapper.find('div')).toHaveLength(1);
  });
});
