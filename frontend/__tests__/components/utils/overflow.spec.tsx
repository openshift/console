/* eslint-disable no-unused-vars, no-undef */

import * as React from 'react';
import { ShallowWrapper, shallow } from 'enzyme';

import { Overflow, OverflowYFade, OverflowLink } from '../../../public/components/utils/overflow';

describe(Overflow.displayName, () => {
  let wrapper: ShallowWrapper<any>;
  let value: string;
  let className: string;

  beforeEach(() => {
    value = 'a-very-long-string';
    className = 'co-m-test';
    wrapper = shallow(<Overflow value={value} className={className} />);
  });

  it('passes `className` to rendered output', () => {
    expect(wrapper.hasClass(className)).toBe(true);
  });

  it('renders input element which selects all text when clicked', () => {
    const input = wrapper.find('input');

    expect(input.exists()).toBe(true);
  });
});

describe(OverflowYFade.displayName, () => {
  let wrapper: ShallowWrapper<any>;
  let className: string;

  beforeEach(() => {
    className = 'co-m-test';
    wrapper = shallow(<OverflowYFade className={className} />);
  });

  it('passes `className` to rendered output', () => {
    expect(wrapper.hasClass(className)).toBe(true);
  });
});

describe(OverflowLink.displayName, () => {
  let wrapper: ShallowWrapper<any>;
  let className: string;
  let value: string;
  let href: string;

  beforeEach(() => {
    className = 'co-m-test';
    value = 'Google';
    href = 'www.google.com';
    wrapper = shallow(<OverflowLink className={className} value={value} href={href} />);
  });

  it('passes `className` to rendered output', () => {
    expect(wrapper.hasClass(className)).toBe(true);
  });

  it('renders a link with given value and href', () => {
    const link = wrapper.find('a');

    expect(link.props().href).toEqual(href);
    expect(link.text()).toEqual(value);
  });
});
