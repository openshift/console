import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import Spotlight from '../Spotlight';
import StaticSpotlight from '../StaticSpotlight';
import InteractiveSpotlight from '../InteractiveSpotlight';

describe('Spotlight', () => {
  type SpotlightProps = React.ComponentProps<typeof Spotlight>;
  let wrapper: ShallowWrapper<SpotlightProps>;
  const uiElementPos = { height: 100, width: 100, top: 100, left: 100 };
  const uiElement = {
    getBoundingClientRect: jest.fn().mockReturnValue(uiElementPos),
    getAttribute: jest.fn().mockReturnValue('false'),
  };
  beforeEach(() => {
    jest.spyOn(document, 'querySelector').mockImplementation(() => uiElement);
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render StaticSpotlight if interactive is not set to true', () => {
    wrapper = shallow(<Spotlight selector="selector" />);
    expect(wrapper.find(StaticSpotlight).exists()).toBe(true);
  });

  it('should render InteractiveSpotlight if interactive is set to true', () => {
    wrapper = shallow(<Spotlight selector="selector" interactive />);
    expect(wrapper.find(InteractiveSpotlight).exists()).toBe(true);
  });

  it('should render nothing when element is hidden for interactive Spotlight', () => {
    const childEl = document.createElement('a');
    childEl.setAttribute('aria-hidden', 'true');
    jest.spyOn(document, 'querySelector').mockImplementation(() => childEl);
    wrapper = shallow(<Spotlight selector="selector" />);
    expect(wrapper.find(StaticSpotlight).exists()).toBe(true);
    wrapper = shallow(<Spotlight selector="selector" interactive />);
    expect(wrapper.find(StaticSpotlight).exists()).toBe(false);
  });

  it('should render nothing when ancestor is hidden', () => {
    const childEl = document.createElement('a');
    const parentEl = document.createElement('a');
    const ancestorEl = document.createElement('a');
    ancestorEl.setAttribute('aria-hidden', 'true');
    parentEl.appendChild(childEl);
    ancestorEl.appendChild(parentEl);
    jest.spyOn(document, 'querySelector').mockImplementation(() => childEl);
    wrapper = shallow(<Spotlight selector="selector" interactive />);
    expect(wrapper.find(StaticSpotlight).exists()).toBe(false);
  });
});
