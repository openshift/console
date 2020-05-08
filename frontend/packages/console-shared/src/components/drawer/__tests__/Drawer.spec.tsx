import * as React from 'react';
import { shallow } from 'enzyme';
import { DraggableData } from 'react-draggable';
import Drawer from '../Drawer';
import DraggableCoreIFrameFix from '../DraggableCoreIFrameFix';

describe('DrawerComponent', () => {
  it('should exist', () => {
    const wrapper = shallow(<Drawer />);
    expect(wrapper.isEmptyRender()).toBe(false);
  });

  it('should have default values', () => {
    const wrapper = shallow(
      <Drawer>
        <p id="dummy-content" />
      </Drawer>,
    );
    expect(wrapper.find(DraggableCoreIFrameFix).exists()).toBe(false);
    const style = wrapper.find('.ocs-drawer').prop('style');
    expect(style.height).toBe(300);
    expect(wrapper.find('#dummy-content')).toHaveLength(1);
  });

  it('should be resizable and height 300', () => {
    const wrapper = shallow(<Drawer resizable />);
    expect(wrapper.find(DraggableCoreIFrameFix).exists()).toBe(true);
    expect(wrapper.find('.ocs-drawer').prop('style').height).toBe(300);
  });

  it('should support initially closed', () => {
    let wrapper = shallow(<Drawer defaultOpen={false} />);
    expect(wrapper.find('.ocs-drawer').prop('style').height).toBe(0);
    wrapper = shallow(<Drawer open={false} />);
    expect(wrapper.find('.ocs-drawer').prop('style').height).toBe(0);
  });

  it('should support initial height', () => {
    let wrapper = shallow(<Drawer defaultHeight={100} />);
    expect(wrapper.find('.ocs-drawer').prop('style').height).toBe(100);
    wrapper = shallow(<Drawer height={100} />);
    expect(wrapper.find('.ocs-drawer').prop('style').height).toBe(100);
  });

  it('should have maximumHeight', () => {
    const height = `calc(100vh - 10%)`;
    const wrapper = shallow(<Drawer maxHeight={height} />);
    expect(wrapper.find('.ocs-drawer').prop('style').maxHeight).toBe(height);
    const nextHeight = 950;
    wrapper.setProps({ maxHeight: nextHeight });
    expect(wrapper.find('.ocs-drawer').prop('style').maxHeight).toBe(nextHeight);
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
    ).toBe('<p>This is header</p>');
  });

  it('should render children', () => {
    const content = 'This is drawer content';
    const wrapper = shallow(
      <Drawer>
        <p id="dummy-content">{content}</p>
      </Drawer>,
    );
    expect(wrapper.find('#dummy-content').exists()).toBe(true);
  });

  it('should be set to minimum height when open is set to false and height if open is set to true', () => {
    const wrapper = shallow(<Drawer defaultHeight={500} open={false} />);
    const style = wrapper.find('.ocs-drawer').prop('style');
    expect(style.height).toBe(0);
    expect(style.minHeight).toBe(0);
    expect(style.maxHeight).toBe('100%');
    wrapper.setProps({ open: true, defaultHeight: 500 });
    expect(wrapper.find('.ocs-drawer').prop('style').height).toBe(500);
  });

  it('should handle resizing', () => {
    const data = {} as DraggableData;
    const onChange = jest.fn();
    const wrapper = shallow(<Drawer resizable defaultHeight={100} onChange={onChange} />);
    wrapper
      .find(DraggableCoreIFrameFix)
      .props()
      .onStart({ pageY: 500 } as any, data);
    expect(wrapper.find('.ocs-drawer').prop('style').height).toBe(100);
    wrapper
      .find(DraggableCoreIFrameFix)
      .props()
      .onDrag({ pageY: 550 } as any, data);
    expect(wrapper.find('.ocs-drawer').prop('style').height).toBe(50);
    expect(onChange).toHaveBeenLastCalledWith(true, 50);
    onChange.mockClear();
    wrapper
      .find(DraggableCoreIFrameFix)
      .props()
      .onDrag({ pageY: 700 } as any, data);
    expect(wrapper.find('.ocs-drawer').prop('style').height).toBe(0);
    expect(onChange).toHaveBeenLastCalledWith(false, 0);
    onChange.mockClear();
    wrapper
      .find(DraggableCoreIFrameFix)
      .props()
      .onStop({} as any, data);
    expect(onChange).toHaveBeenLastCalledWith(false, 100);
  });
});
