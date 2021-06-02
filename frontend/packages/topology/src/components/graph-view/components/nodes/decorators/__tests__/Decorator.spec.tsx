import * as React from 'react';
import { shallow } from 'enzyme';
import { Link } from 'react-router-dom';
import Decorator from '../Decorator';

describe('Decorator', () => {
  it('should show anchors for external links', () => {
    const decorator = shallow(<Decorator x={0} y={0} radius={10} external href="http://test" />);
    expect(decorator.find('a').exists()).toBe(true);
    expect(decorator.find(Link).exists()).toBe(false);
  });
  it('should show Links for internal links', () => {
    const decorator = shallow(<Decorator x={0} y={0} radius={10} href="/test" />);
    expect(decorator.find('a').exists()).toBe(false);
    expect(decorator.find(Link).exists()).toBe(true);
  });
});
