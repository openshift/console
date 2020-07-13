import * as React from 'react';
import { shallow } from 'enzyme';
import { InternalDetectPerspective } from '../DetectPerspective';
import PerspectiveDetector from '../PerspectiveDetector';

const MockApp = () => <h1>App</h1>;

describe('DetectPerspective', () => {
  it('should render children if there is an activePerspective', () => {
    const wrapper = shallow(
      <InternalDetectPerspective activePerspective="dev" setActivePerspective={() => {}}>
        <MockApp />
      </InternalDetectPerspective>,
    );
    expect(wrapper.find(MockApp).exists()).toBe(true);
  });

  it('should render PerspectiveDetector if there is no activePerspective', () => {
    const wrapper = shallow(
      <InternalDetectPerspective activePerspective={undefined} setActivePerspective={() => {}}>
        <MockApp />
      </InternalDetectPerspective>,
    );
    expect(wrapper.find(PerspectiveDetector).exists()).toBe(true);
  });
});
