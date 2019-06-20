import * as React from 'react';
import { shallow } from 'enzyme';
import ProgressiveListFooter from '../ProgressiveListFooter';

describe(ProgressiveListFooter.name, () => {
  it('should return JSX element if items array is not empty', () => {
    const wrapper = shallow(
      <ProgressiveListFooter text="DummyText" items={['Foo']} onShowItem={() => {}} />,
    );
    expect(wrapper.find('p').exists()).toBe(true);
  });

  it('should return null if items array is empty', () => {
    const wrapper = shallow(
      <ProgressiveListFooter text="DummyText" items={[]} onShowItem={() => {}} />,
    );
    expect(wrapper.find('p').exists()).toBe(false);
  });

  it('should generate correct text', () => {
    const wrapper = shallow(
      <ProgressiveListFooter
        text="Dummy text"
        items={['Foo', 'Bar', 'One']}
        onShowItem={() => {}}
      />,
    );
    expect(wrapper.find('p').text()).toEqual('Dummy text Foo, Bar and One.');
  });

  it('should have number of button equals to items in array', () => {
    const wrapper = shallow(
      <ProgressiveListFooter
        text="DummyText"
        items={['Foo', 'Bar', 'One']}
        onShowItem={() => {}}
      />,
    );
    expect(wrapper.find('button')).toHaveLength(3);
  });
});
