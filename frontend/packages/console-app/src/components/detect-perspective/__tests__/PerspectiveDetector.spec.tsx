import * as React from 'react';
import { render, waitFor } from '@testing-library/react';
import { useLocation } from 'react-router-dom-v5-compat';
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

jest.mock('react-router-dom-v5-compat', () => ({
  ...require.requireActual('react-router-dom-v5-compat'),
  useLocation: jest.fn(() => ({ pathname: '' })),
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

const useLocationMock = useLocation as jest.Mock;

describe('PerspectiveDetector', () => {
  beforeEach(() => {
    setActivePerspective.mockClear();
  });

  it('should set default perspective when there are no perspective detectors available', async () => {
    (usePerspectives as jest.Mock).mockImplementation(() => mockPerspectives);

    render(<PerspectiveDetector setActivePerspective={setActivePerspective} />);

    await waitFor(() => {
      expect(setActivePerspective).toHaveBeenCalledWith('admin', '');
    });
  });

  it('should set detected perspective when detection is successful', async () => {
    let promiseResolver: (value: () => [boolean, boolean]) => void;
    const testPromise = new Promise<() => [boolean, boolean]>(
      (resolver) => (promiseResolver = resolver),
    );
    mockPerspectives[1].properties.usePerspectiveDetection = () => testPromise;

    (usePerspectives as jest.Mock).mockImplementation(() => mockPerspectives);

    render(<PerspectiveDetector setActivePerspective={setActivePerspective} />);

    promiseResolver(() => [true, false]);

    await waitFor(() => {
      expect(setActivePerspective).toHaveBeenCalledWith('dev', '');
    });
  });

  it('should set default perspective when detection fails', async () => {
    let promiseResolver: (value: () => [boolean, boolean]) => void;
    const testPromise = new Promise<() => [boolean, boolean]>(
      (resolver) => (promiseResolver = resolver),
    );
    mockPerspectives[1].properties.usePerspectiveDetection = () => testPromise;

    (usePerspectives as jest.Mock).mockImplementation(() => mockPerspectives);

    render(<PerspectiveDetector setActivePerspective={setActivePerspective} />);

    promiseResolver(() => [false, false]);

    await waitFor(() => {
      expect(setActivePerspective).toHaveBeenCalledWith('admin', '');
    });
  });

  it('should set admin as default perspective when all perspectives are disabled', async () => {
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

    let promiseResolver: (value: () => [boolean, boolean]) => void;
    const testPromise = new Promise<() => [boolean, boolean]>(
      (resolver) => (promiseResolver = resolver),
    );
    mockPerspectives[1].properties.usePerspectiveDetection = () => testPromise;

    (usePerspectives as jest.Mock).mockImplementation(() => mockPerspectives);

    render(<PerspectiveDetector setActivePerspective={setActivePerspective} />);

    promiseResolver(() => [false, false]);

    await waitFor(() => {
      expect(setActivePerspective).toHaveBeenCalledWith('admin', '');
    });
  });

  it('preserves query and hash when setting perspective', async () => {
    let promiseResolver: (value: () => [boolean, boolean]) => void;
    const testPromise = new Promise<() => [boolean, boolean]>(
      (resolver) => (promiseResolver = resolver),
    );
    mockPerspectives[1].properties.usePerspectiveDetection = () => testPromise;

    (usePerspectives as jest.Mock).mockImplementation(() => mockPerspectives);
    useLocationMock.mockImplementation(() => ({
      pathname: '/some/path',
      search: '?query=param',
      hash: '#some-hash',
    }));

    render(<PerspectiveDetector setActivePerspective={setActivePerspective} />);

    promiseResolver(() => [true, false]);

    await waitFor(() => {
      expect(setActivePerspective).toHaveBeenCalledWith('dev', '/some/path?query=param#some-hash');
    });
  });
});
