import * as React from 'react';
import { mount } from 'enzyme';
import { Perspective, useExtensions } from '@console/plugin-sdk';
import PerspectiveDetector from '../PerspectiveDetector';

jest.mock('@console/plugin-sdk', () => ({
  useExtensions: jest.fn(),
}));

const mockPerspectives = [
  {
    type: 'Perspective',
    properties: {
      id: 'admin',
      name: 'Admin Perspective',
      default: true,
    },
  },
  {
    type: 'Perspective',
    properties: {
      id: 'dev',
      name: 'Dev Perspective',
      usePerspectiveDetection: undefined,
    },
  },
] as Perspective[];

const setActivePerspective = jest.fn();

describe('PerspectiveDetector', () => {
  it('should set default perspective if there are no perspective detectors available', () => {
    (useExtensions as jest.Mock).mockImplementation(() => mockPerspectives);

    const wrapper = mount(<PerspectiveDetector setActivePerspective={setActivePerspective} />);
    expect(wrapper.isEmptyRender()).toBe(true);
    expect(setActivePerspective).toHaveBeenCalledWith('admin');
  });

  it('should set detected perspective if detection is successful', () => {
    mockPerspectives[1].properties.usePerspectiveDetection = () => [true, false];
    (useExtensions as jest.Mock).mockImplementation(() => mockPerspectives);

    const wrapper = mount(<PerspectiveDetector setActivePerspective={setActivePerspective} />);
    expect(wrapper.isEmptyRender()).toBe(true);
    expect(setActivePerspective).toHaveBeenCalledWith('dev');
  });

  it('should set default perspective if detection fails', () => {
    mockPerspectives[1].properties.usePerspectiveDetection = () => [false, false];
    (useExtensions as jest.Mock).mockImplementation(() => mockPerspectives);

    const wrapper = mount(<PerspectiveDetector setActivePerspective={setActivePerspective} />);
    expect(wrapper.isEmptyRender()).toBe(true);
    expect(setActivePerspective).toHaveBeenCalledWith('admin');
  });
});
