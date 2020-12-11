import * as React from 'react';
import { shallow } from 'enzyme';
import { InternalDetectPerspective } from '../DetectPerspective';
import PerspectiveDetector from '../PerspectiveDetector';
import { useValuesForPerspectiveContext } from '../useValuesForPerspectiveContext';

const MockApp = () => <h1>App</h1>;

jest.mock('../useValuesForPerspectiveContext', () => ({
  useValuesForPerspectiveContext: jest.fn(),
}));

const useValuesForPerspectiveContextMock = useValuesForPerspectiveContext as jest.Mock;

describe('DetectPerspective', () => {
  beforeEach(() => {
    useValuesForPerspectiveContextMock.mockClear();
  });
  it('should render children if there is an activePerspective', () => {
    useValuesForPerspectiveContextMock.mockReturnValue(['dev', () => {}, true]);
    const wrapper = shallow(
      <InternalDetectPerspective>
        <MockApp />
      </InternalDetectPerspective>,
    );
    expect(wrapper.find(MockApp).exists()).toBe(true);
  });

  it('should render PerspectiveDetector if there is no activePerspective', () => {
    useValuesForPerspectiveContextMock.mockReturnValue([undefined, () => {}, true]);
    const wrapper = shallow(
      <InternalDetectPerspective>
        <MockApp />
      </InternalDetectPerspective>,
    );
    expect(wrapper.find(PerspectiveDetector).exists()).toBe(true);
  });
});
