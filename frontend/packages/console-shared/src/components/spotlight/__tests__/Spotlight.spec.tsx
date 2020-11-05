import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import Spotlight from '../Spotlight';
import StaticSpotlight from '../StaticSpotlight';
import InteractiveSpotlight from '../InteractiveSpotlight';

describe('Spotlight', () => {
  type SpotlightProps = React.ComponentProps<typeof Spotlight>;
  let wrapper: ShallowWrapper<SpotlightProps>;
  const uiElementPos = { height: 100, width: 100, top: 100, left: 100 };
  const uiElement = { getBoundingClientRect: jest.fn().mockReturnValue(uiElementPos) };
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
});
