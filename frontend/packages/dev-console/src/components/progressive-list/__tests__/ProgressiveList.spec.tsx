import * as React from 'react';
import { shallow } from 'enzyme';
import ProgressiveList from '../ProgressiveList';
import ProgressiveListItem from '../ProgressiveListItem';
import ProgressiveListFooter from '../ProgressiveListFooter';

const DummyComponent: React.FC = () => <div id="dummy">Dummy Component</div>;
const BarComponent: React.FC = () => <div id="bar">Bar Component</div>;
const FooComponent: React.FC = () => <div id="foo">Foo Component</div>;

describe(ProgressiveList.displayName, () => {
  it('component should exist', () => {
    const wrapper = shallow(
      <ProgressiveList text="dummy text" visibleItems={[]} onVisibleItemChange={() => {}}>
        <ProgressiveListItem name="Dummy">
          <DummyComponent />
        </ProgressiveListItem>
      </ProgressiveList>,
    );
    expect(wrapper.exists()).toBe(true);
  });

  it('should only display component related to item name mentioned in the visibleItems array', () => {
    const wrapper = shallow(
      <ProgressiveList
        text="dummy text"
        visibleItems={['Bar', 'Foo']}
        onVisibleItemChange={() => {}}
      >
        <ProgressiveListItem name="Dummy">
          <DummyComponent />
        </ProgressiveListItem>
        <ProgressiveListItem name="Bar">
          <BarComponent />
        </ProgressiveListItem>
        <ProgressiveListItem name="Foo">
          <FooComponent />
        </ProgressiveListItem>
      </ProgressiveList>,
    );
    expect(wrapper.find(BarComponent).exists()).toBe(true);
    expect(wrapper.find(FooComponent).exists()).toBe(true);
    expect(wrapper.find(DummyComponent).exists()).toBe(false);
  });

  it('clicking on a button should add that component related to it to visibleItems list', () => {
    const visibleItems = [];
    const callback = (item: string) => {
      visibleItems.push(item);
    };
    const wrapper = shallow(
      <ProgressiveList text="dummy text" visibleItems={visibleItems} onVisibleItemChange={callback}>
        <ProgressiveListItem name="Dummy">
          <DummyComponent />
        </ProgressiveListItem>
      </ProgressiveList>,
    );
    expect(
      wrapper
        .find(ProgressiveListFooter)
        .shallow()
        .find('button')
        .text(),
    ).toEqual('Dummy');
    expect(
      wrapper
        .find(ProgressiveListFooter)
        .shallow()
        .find('button'),
    ).toHaveLength(1);
    expect(wrapper.find(DummyComponent).exists()).toBe(false);
    expect(visibleItems).toHaveLength(0);
    wrapper
      .find(ProgressiveListFooter)
      .shallow()
      .find('button')
      .simulate('click', { target: { innerText: 'Dummy' } });
    expect(visibleItems).toHaveLength(1);
    expect(visibleItems.includes('Dummy')).toBe(true);
    wrapper.setProps({ visibleItems });
    expect(wrapper.find(DummyComponent).exists()).toBe(true);
    expect(
      wrapper
        .find(ProgressiveListFooter)
        .shallow()
        .find('button'),
    ).toHaveLength(0);
  });
});
