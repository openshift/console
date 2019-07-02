import * as React from 'react';
import { mount, shallow } from 'enzyme';
import BaseNode, { BaseNodeProps, State } from '../BaseNode';
import SvgBoxedText from '../../../svg/SvgBoxedText';

jest.mock('../../../svg/SvgDefs');
jest.mock('@console/internal/components/catalog/catalog-item-icon', () => ({
  getImageForIconClass: (path: string) => (path === 'icon-unknown' ? null : path),
}));

describe('BaseNode', () => {
  it('should not render label if label is undefined', () => {
    const wrapper = shallow(<BaseNode outerRadius={100} />);
    expect(wrapper.find('text').exists()).toBeFalsy();
  });

  it('should not truncate labels <= 16 characters', () => {
    const wrapper = shallow(<BaseNode outerRadius={100} label="1234567890abcdef" />);
    expect(
      wrapper
        .find(SvgBoxedText)
        .shallow()
        .find('text')
        .text(),
    ).toBe('1234567890abcdef');
  });

  it('should truncate labels > 16 characters', () => {
    const wrapper = shallow(<BaseNode outerRadius={100} label="1234567890abcdefgh" />);
    expect(
      wrapper
        .find(SvgBoxedText)
        .shallow()
        .find('text')
        .text(),
    ).toBe('1234567890abcde…');
  });

  it('should show long labels on hover', () => {
    const wrapper = shallow<BaseNodeProps, State>(
      <BaseNode outerRadius={100} label="1234567890abcdefgh" />,
    );
    wrapper.setState({ hover: true });
    expect(
      wrapper
        .find(SvgBoxedText)
        .shallow()
        .find('text')
        .text(),
    ).toBe('1234567890abcdefgh');
  });

  it('should show different drop shadow on hover', () => {
    const wrapper = shallow<BaseNodeProps, State>(<BaseNode outerRadius={100} />);
    expect(
      wrapper
        .find('.odc-base-node__bg')
        .first()
        .props().filter,
    ).toBe('url(blank#BaseNodeDropShadowFilterId)');

    wrapper.setState({ hover: true });
    expect(
      wrapper
        .find('.odc-base-node__bg')
        .first()
        .props().filter,
    ).toBe('url(blank#BaseNodeDropShadowFilterId--hover)');
  });

  it('should show long labels when selected', () => {
    const wrapper = shallow(<BaseNode outerRadius={100} selected label="1234567890abcdefgh" />);
    expect(
      wrapper
        .find(SvgBoxedText)
        .shallow()
        .find('text')
        .text(),
    ).toBe('1234567890abcdefgh');
  });

  it('should render selection', () => {
    const wrapper = shallow(<BaseNode outerRadius={100} selected />);
    expect(wrapper.find('.odc-base-node__selection').exists()).toBeTruthy();
  });

  it('should render children and attachments', () => {
    const wrapper = shallow(
      <BaseNode outerRadius={100}>
        <g id="test" />
      </BaseNode>,
    );
    expect(wrapper.find('#test').exists()).toBeTruthy();
  });

  it('should render attachments', () => {
    const wrapper = shallow(
      <BaseNode
        outerRadius={100}
        attachments={[<g id="first" key="first" />, <g id="second" key="second" />]}
      />,
    );
    expect(wrapper.find('#first').exists()).toBeTruthy();
    expect(wrapper.find('#second').exists()).toBeTruthy();
  });

  it('should render icon', () => {
    const wrapper = shallow(<BaseNode outerRadius={100} icon="testicon" />);
    const imageWrapper = wrapper.find('image');
    expect(imageWrapper.props().xlinkHref).toBe('icon-testicon');
  });

  it('should render fallback icon if icon cannot be found', () => {
    const wrapper = shallow(<BaseNode outerRadius={100} icon="unknown" />);
    const imageWrapper = wrapper.find('image');
    expect(imageWrapper.props().xlinkHref).toBe('icon-openshift');
  });

  it('should handle selection', () => {
    const onSelect = jest.fn();
    const fakeEvent = { stopPropagation: jest.fn() };
    const wrapper = mount(<BaseNode outerRadius={100} onSelect={onSelect} />);
    wrapper.find('circle').simulate('click', fakeEvent);
    expect(onSelect).toHaveBeenCalled();
    expect(fakeEvent.stopPropagation).toHaveBeenCalled();
  });

  it('should ignore selectioon from attachments handle selection', () => {
    const onSelect = jest.fn();
    const fakeEvent = { stopPropagation: jest.fn() };
    const wrapper = mount(
      <BaseNode outerRadius={100} onSelect={onSelect} attachments={<g id="attachment" />} />,
    );
    wrapper.find('#attachment').simulate('click', fakeEvent);
    expect(onSelect).not.toHaveBeenCalled();
  });
});
