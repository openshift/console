import * as React from 'react';
import { mount } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { Perspective } from '@console/dynamic-plugin-sdk';
import { useExtensions, LoadedExtension } from '@console/plugin-sdk';
import PerspectiveDetector from '../PerspectiveDetector';

jest.mock('@console/plugin-sdk', () => ({
  useExtensions: jest.fn(),
}));

const mockPerspectives = [
  {
    type: 'console.perspective',
    properties: {
      id: 'admin',
      name: 'Admin Perspective',
      default: true,
    },
  },
  {
    type: 'console.perspective',
    properties: {
      id: 'dev',
      name: 'Dev Perspective',
      usePerspectiveDetection: undefined,
    },
  },
] as LoadedExtension<Perspective>[];

const setActivePerspective = jest.fn();

describe('PerspectiveDetector', () => {
  it('should set default perspective if there are no perspective detectors available', async () => {
    (useExtensions as jest.Mock).mockImplementation(() => mockPerspectives);

    const wrapper = mount(<PerspectiveDetector setActivePerspective={setActivePerspective} />);
    expect(wrapper.isEmptyRender()).toBe(true);
    expect(setActivePerspective).toHaveBeenCalledWith('admin');
  });

  it('should set detected perspective if detection is successful', async () => {
    // create a promise and capture the resolver such that we can use act later on to ensure
    // the test waits for this promise to resolve before continuing
    let promiseResolver: (value: () => [boolean, boolean]) => void;
    const testPromise = new Promise<() => [boolean, boolean]>(
      (resolver) => (promiseResolver = resolver),
    );
    mockPerspectives[1].properties.usePerspectiveDetection = () => testPromise;

    (useExtensions as jest.Mock).mockImplementation(() => mockPerspectives);

    const wrapper = mount(<PerspectiveDetector setActivePerspective={setActivePerspective} />);
    await act(async () => {
      promiseResolver(() => [true, false]);
    });
    expect(wrapper.isEmptyRender()).toBe(true);
    expect(setActivePerspective).toHaveBeenCalledWith('dev');
  });

  it('should set default perspective if detection fails', async () => {
    // create a promise and capture the resolver such that we can use act later on to ensure
    // the test waits for this promise to resolve before continuing
    let promiseResolver: (value: () => [boolean, boolean]) => void;
    const testPromise = new Promise<() => [boolean, boolean]>(
      (resolver) => (promiseResolver = resolver),
    );
    mockPerspectives[1].properties.usePerspectiveDetection = () => testPromise;

    (useExtensions as jest.Mock).mockImplementation(() => mockPerspectives);

    const wrapper = mount(<PerspectiveDetector setActivePerspective={setActivePerspective} />);
    await act(async () => {
      promiseResolver(() => [false, false]);
    });
    expect(wrapper.isEmptyRender()).toBe(true);
    expect(setActivePerspective).toHaveBeenCalledWith('admin');
  });
});
