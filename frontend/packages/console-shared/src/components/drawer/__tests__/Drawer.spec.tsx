import * as React from 'react';
import { shallow } from 'enzyme';
import Drawer from '../Drawer';
import { DraggableCore } from 'react-draggable';

describe('DrawerComponent', () => {
  it('should exist', () => {
    const wrapper = shallow(<Drawer />);
    expect(wrapper.isEmptyRender()).toBe(false);
  });

  it('should have default values', () => {
    const content = 'This is content';
    const wrapper = shallow(
      <Drawer>
        <p id="dummy-content">{content}</p>
      </Drawer>,
    );
    expect(wrapper.find(DraggableCore).exists()).toBe(false);
    const style = wrapper.find('.ocs-drawer').prop('style');
    expect(style.height).toEqual(300);
    expect(wrapper.find('#dummy-content')).toHaveLength(1);
  });

  it('should be resizable and height 300', () => {
    const wrapper = shallow(<Drawer resizable />);
    expect(wrapper.find(DraggableCore).exists()).toBe(true);
    expect(wrapper.find('.ocs-drawer').prop('style').height).toEqual(300);
  });

  it('should have maximumHeight', () => {
    const height = `calc(100vh - 10%)`;
    const wrapper = shallow(<Drawer maxHeight={height} />);
    expect(wrapper.find('.ocs-drawer').prop('style').maxHeight).toEqual(height);
    const nextHeight = 950;
    wrapper.setProps({ maxHeight: nextHeight });
    expect(wrapper.find('.ocs-drawer').prop('style').maxHeight).toEqual(nextHeight);
  });

  it('should have header', () => {
    const wrapper = shallow(<Drawer />);
    expect(wrapper.find('.ocs-drawer__header').children()).toHaveLength(0);
    wrapper.setProps({ header: <p>This is header</p> });
    expect(wrapper.find('.ocs-drawer__header').children()).toHaveLength(1);
    expect(
      wrapper
        .find('.ocs-drawer__header')
        .children()
        .html(),
    ).toEqual('<p>This is header</p>');
  });

  it('should render children', () => {
    const content = 'This is drawer content';
    const wrapper = shallow(
      <Drawer>
        <p id="dummy-content">{content}</p>
      </Drawer>,
    );
    expect(wrapper.find('#dummy-content').exists()).toEqual(true);
    expect(wrapper.find('#dummy-content').text()).toEqual(content);
  });

  it('should be set to minimum height when open is set to false and height if open is set to true', () => {
    const wrapper = shallow(<Drawer defaultHeight={500} open={false} />);
    const style = wrapper.find('.ocs-drawer').prop('style');
    expect(style.height).toEqual(0);
    expect(style.minHeight).toEqual(0);
    expect(style.maxHeight).toEqual('100%');
    wrapper.setProps({ open: true, defaultHeight: 500 });
    expect(wrapper.find('.ocs-drawer').prop('style').height).toEqual(500);
  });
});
