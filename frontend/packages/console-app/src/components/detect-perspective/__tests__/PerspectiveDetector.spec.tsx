import * as React from 'react';
import { mount } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { Perspective } from '@console/dynamic-plugin-sdk';
import { LoadedExtension } from '@console/plugin-sdk';
import { usePerspectives } from '@console/shared/src';
import {
  Perspective as PerspectiveType,
  PerspectiveVisibilityState,
} from '@console/shared/src/hooks';
import PerspectiveDetector from '../PerspectiveDetector';

jest.mock('@console/shared/src', () => ({
  usePerspectives: jest.fn(),
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
    (usePerspectives as jest.Mock).mockImplementation(() => mockPerspectives);

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

    (usePerspectives as jest.Mock).mockImplementation(() => mockPerspectives);

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

    (usePerspectives as jest.Mock).mockImplementation(() => mockPerspectives);

    const wrapper = mount(<PerspectiveDetector setActivePerspective={setActivePerspective} />);
    await act(async () => {
      promiseResolver(() => [false, false]);
    });
    expect(wrapper.isEmptyRender()).toBe(true);
    expect(setActivePerspective).toHaveBeenCalledWith('admin');
  });

  it('should set admin as default perspective if all perspectives are disabled', async () => {
    const perspectives: PerspectiveType[] = [
      {
        id: 'dev',
        visibility: {
          state: PerspectiveVisibilityState.AccessReview,
          accessReview: {
            missing: [
              {
                resource: 'namespaces',
                verb: 'list',
              },
            ],
          },
        },
      },
      {
        id: 'admin',
        visibility: {
          state: PerspectiveVisibilityState.Disabled,
        },
      },
      {
        id: 'dev-test',
        visibility: {
          state: PerspectiveVisibilityState.Disabled,
        },
      },
    ];
    window.SERVER_FLAGS.perspectives = JSON.stringify(perspectives);
    // create a promise and capture the resolver such that we can use act later on to ensure
    // the test waits for this promise to resolve before continuing
    let promiseResolver: (value: () => [boolean, boolean]) => void;
    const testPromise = new Promise<() => [boolean, boolean]>(
      (resolver) => (promiseResolver = resolver),
    );
    mockPerspectives[1].properties.usePerspectiveDetection = () => testPromise;

    (usePerspectives as jest.Mock).mockImplementation(() => mockPerspectives);

    const wrapper = mount(<PerspectiveDetector setActivePerspective={setActivePerspective} />);
    await act(async () => {
      promiseResolver(() => [false, false]);
    });
    expect(wrapper.isEmptyRender()).toBe(true);
    expect(setActivePerspective).toHaveBeenCalledWith('admin');
  });
});
