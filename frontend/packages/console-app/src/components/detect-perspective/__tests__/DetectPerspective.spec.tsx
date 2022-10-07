import * as React from 'react';
import { shallow } from 'enzyme';
import { usePerspectives } from '@console/shared/src';
import DetectPerspective from '../DetectPerspective';
import PerspectiveDetector from '../PerspectiveDetector';
import { useValuesForPerspectiveContext } from '../useValuesForPerspectiveContext';

const MockApp = () => <h1>App</h1>;

jest.mock('../useValuesForPerspectiveContext', () => ({
  useValuesForPerspectiveContext: jest.fn(),
}));

jest.mock('@console/shared/src', () => ({
  usePerspectives: jest.fn(),
}));
const useValuesForPerspectiveContextMock = useValuesForPerspectiveContext as jest.Mock;
const usePerspectivesMock = usePerspectives as jest.Mock;

describe('DetectPerspective', () => {
  beforeEach(() => {
    useValuesForPerspectiveContextMock.mockClear();
    usePerspectivesMock.mockClear();
  });
  it('should render children if there is an activePerspective', () => {
    useValuesForPerspectiveContextMock.mockReturnValue(['dev', () => {}, true]);
    usePerspectivesMock.mockReturnValue([
      { properties: { id: 'admin' } },
      { properties: { id: 'dev' } },
      { properties: { id: 'dev-test' } },
    ]);
    const wrapper = shallow(
      <DetectPerspective>
        <MockApp />
      </DetectPerspective>,
    );
    expect(wrapper.find(MockApp).exists()).toBe(true);
  });

  it('should render PerspectiveDetector if there is no activePerspective', () => {
    useValuesForPerspectiveContextMock.mockReturnValue([undefined, () => {}, true]);
    const wrapper = shallow(
      <DetectPerspective>
        <MockApp />
      </DetectPerspective>,
    );
    expect(wrapper.find(PerspectiveDetector).exists()).toBe(true);
  });
});
