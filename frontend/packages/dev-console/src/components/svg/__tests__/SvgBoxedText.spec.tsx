import * as React from 'react';
import { shallow } from 'enzyme';
import SvgBoxedText, { SvgBoxedTextProps, State } from '../SvgBoxedText';
import SvgResourceIcon from '../../topology/shapes/ResourceIcon';

describe('SvgBoxedText', () => {
  it('should initially render without a backdrop', () => {
    const wrapper = shallow(<SvgBoxedText />);
    expect(wrapper.find('rect').exists()).toBeFalsy();
  });

  it('should render backdrop around text', () => {
    const wrapper = shallow(<SvgBoxedText />);
    wrapper.setState({ bb: { width: 20, height: 10 } });
    expect(wrapper.find('rect').exists()).toBeTruthy();
  });

  it('should position backdrop around text', () => {
    const wrapper = shallow<SvgBoxedTextProps, State>(
      <SvgBoxedText cornerRadius={5} x={100} y={200} paddingX={10} paddingY={5} />,
    );
    wrapper.setState({ bb: { width: 50, height: 20 } });
    const rectWrapper = wrapper.find('rect').first();
    const { filter, ...otherProps } = rectWrapper.props();
    expect(otherProps).toEqual({
      rx: 5,
      ry: 5,
      x: 65,
      y: 185,
      width: 70,
      height: 30,
    });
  });

  it('should render a text with backdrop around it if kind is given', () => {
    const wrapper = shallow(<SvgBoxedText x={100} y={200} kind="Deployment" />);
    wrapper.setState({ bb: { width: 50, height: 20 } });
    expect(wrapper.find('rect')).toHaveLength(1);
    expect(wrapper.find(SvgResourceIcon)).toHaveLength(1);
    const badge = wrapper.find(SvgResourceIcon).first();
    expect(
      badge
        .shallow()
        .find('text')
        .text(),
    ).toEqual('D');
  });

  it('should not render ResourceIcon if kind is not given', () => {
    const wrapper = shallow(<SvgBoxedText x={100} y={200} />);
    wrapper.setState({ bb: { width: 50, height: 20 } });
    expect(wrapper.find('rect')).toHaveLength(1);
    expect(wrapper.find(SvgResourceIcon)).toHaveLength(0);
  });
});
