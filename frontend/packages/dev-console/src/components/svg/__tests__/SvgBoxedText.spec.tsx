import * as React from 'react';
import { shallow } from 'enzyme';
import SvgBoxedText, { SvgBoxedTextProps, State } from '../SvgBoxedText';
import SvgResourceIcon from '../../topology/shapes/ResourceIcon';
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-require-imports */
const reactMock = require('react');
/* eslint-enable @typescript-eslint/no-require-imports */
/* eslint-enable @typescript-eslint/no-var-requires */
const mockUseState = (initial: {}) => jest.fn().mockImplementation(() => [initial, () => {}]);

describe('SvgBoxedText', () => {
  it('should initially render without a backdrop', () => {
    const wrapper = shallow(<SvgBoxedText />);
    expect(wrapper.find('rect').exists()).toBeFalsy();
  });

  it('should render backdrop around text', () => {
    reactMock.useState = mockUseState({ width: 20, height: 10 });
    const wrapper = shallow(<SvgBoxedText />);
    expect(wrapper.find('rect').exists()).toBeTruthy();
  });

  it('should position backdrop around text', () => {
    reactMock.useState = mockUseState({ width: 50, height: 20 });
    const wrapper = shallow<SvgBoxedTextProps, State>(
      <SvgBoxedText cornerRadius={5} x={100} y={200} paddingX={10} paddingY={5} />,
    );
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
    reactMock.useState = mockUseState({ width: 50, height: 20 });
    const wrapper = shallow(<SvgBoxedText x={100} y={200} kind="Deployment" />);
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
    reactMock.useState = mockUseState({ width: 50, height: 20 });
    const wrapper = shallow(<SvgBoxedText x={100} y={200} />);
    expect(wrapper.find('rect')).toHaveLength(1);
    expect(wrapper.find(SvgResourceIcon)).toHaveLength(0);
  });
});
