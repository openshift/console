import { act } from 'react-dom/test-utils';
import { checkAccess } from '@console/dynamic-plugin-sdk/src/app/components/utils/rbac';
import { useExtensions } from '@console/plugin-sdk';
import { usePerspectives } from '..';
import { testHook } from '../../../../../__tests__/utils/hooks-utils';
import { Perspective, PerspectiveVisibilityState } from '../perspective-utils';

const useExtensionsMock = useExtensions as jest.Mock;

jest.mock('@console/plugin-sdk/src/api/useExtensions', () => ({ useExtensions: jest.fn() }));

jest.mock('@console/dynamic-plugin-sdk/src/app/components/utils/rbac', () => ({
  checkAccess: jest.fn(),
}));
describe('usePerspectives', () => {
  beforeEach(() => {
    window.SERVER_FLAGS.perspectives = undefined;
    useExtensionsMock.mockClear();
    useExtensionsMock.mockReturnValue([
      {
        type: 'Perspective',
        properties: {
          id: 'admin',
          name: 'Administrator',
        },
      },
      {
        type: 'Perspective',
        properties: {
          id: 'dev',
          name: 'Developer',
          defaultPins: [{ kind: 'ConfigMap' }, { kind: 'Secret' }],
        },
      },
      {
        type: 'Perspective',
        properties: {
          id: 'dev-test',
          name: 'Test Developer',
          defaultPins: [{ kind: 'Deployments' }, { kind: 'Secret' }],
        },
      },
    ]);
  });

  it('should return all the available perspectives if perspectives are not set in the server flags', async () => {
    window.SERVER_FLAGS.perspectives = undefined;

    const { result } = testHook(() => usePerspectives());

    expect(result.current).toEqual([
      {
        type: 'Perspective',
        properties: {
          id: 'admin',
          name: 'Administrator',
        },
      },
      {
        type: 'Perspective',
        properties: {
          id: 'dev',
          name: 'Developer',
          defaultPins: [{ kind: 'ConfigMap' }, { kind: 'Secret' }],
        },
      },
      {
        type: 'Perspective',
        properties: {
          id: 'dev-test',
          name: 'Test Developer',
          defaultPins: [{ kind: 'Deployments' }, { kind: 'Secret' }],
        },
      },
    ]);
  });

  it('should return all the available perspectives if perspectives are not configured in the server flags', async () => {
    window.SERVER_FLAGS.perspectives = '';

    const { result } = testHook(() => usePerspectives());

    expect(result.current).toEqual([
      {
        type: 'Perspective',
        properties: {
          id: 'admin',
          name: 'Administrator',
        },
      },
      {
        type: 'Perspective',
        properties: {
          id: 'dev',
          name: 'Developer',
          defaultPins: [{ kind: 'ConfigMap' }, { kind: 'Secret' }],
        },
      },
      {
        type: 'Perspective',
        properties: {
          id: 'dev-test',
          name: 'Test Developer',
          defaultPins: [{ kind: 'Deployments' }, { kind: 'Secret' }],
        },
      },
    ]);
  });

  it('should return only the enabled perspectives and the perspectives that satisfy the missing accessreview checks that are set in the server flags', async () => {
    const perspectives: Perspective[] = [
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
          state: PerspectiveVisibilityState.Enabled,
        },
      },
    ];
    window.SERVER_FLAGS.perspectives = JSON.stringify(perspectives);
    (checkAccess as jest.Mock).mockReturnValue(Promise.resolve({ status: { allowed: true } }));
    const { result, rerender } = testHook(() => usePerspectives());

    await act(async () => {
      rerender();
    });
    expect(result.current).toEqual([
      {
        type: 'Perspective',
        properties: {
          id: 'dev-test',
          name: 'Test Developer',
          defaultPins: [{ kind: 'Deployments' }, { kind: 'Secret' }],
        },
      },
    ]);
  });

  it('should return the admin perspective as default if all the perspectives are disabled', async () => {
    const perspectives: Perspective[] = [
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
    (checkAccess as jest.Mock).mockReturnValue(Promise.resolve({ status: { allowed: true } }));

    const { result, rerender } = testHook(() => usePerspectives());

    await act(async () => {
      rerender();
    });

    expect(result.current).toEqual([
      {
        type: 'Perspective',
        properties: {
          id: 'admin',
          name: 'Administrator',
        },
      },
    ]);
  });

  it('should return only the enabled perspectives and the perspectives that satisfy the required accessreview checks that are set in the server flags', async () => {
    const perspectives: Perspective[] = [
      {
        id: 'dev',
        visibility: {
          state: PerspectiveVisibilityState.AccessReview,
          accessReview: {
            required: [
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
          state: PerspectiveVisibilityState.Enabled,
        },
      },
    ];
    window.SERVER_FLAGS.perspectives = JSON.stringify(perspectives);
    (checkAccess as jest.Mock).mockReturnValue(Promise.resolve({ status: { allowed: true } }));
    const { result, rerender } = testHook(() => usePerspectives());

    await act(async () => {
      rerender();
    });

    expect(result.current).toEqual([
      {
        type: 'Perspective',
        properties: {
          id: 'dev',
          name: 'Developer',
          defaultPins: [{ kind: 'ConfigMap' }, { kind: 'Secret' }],
        },
      },
      {
        type: 'Perspective',
        properties: {
          id: 'dev-test',
          name: 'Test Developer',
          defaultPins: [{ kind: 'Deployments' }, { kind: 'Secret' }],
        },
      },
    ]);
  });

  it('should handle perspectives with accessReview checks', async () => {
    const perspectives: Perspective[] = [
      {
        id: 'dev',
        visibility: {
          state: PerspectiveVisibilityState.AccessReview,
          accessReview: {
            required: [],
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
          state: PerspectiveVisibilityState.Enabled,
        },
      },
    ];
    window.SERVER_FLAGS.perspectives = JSON.stringify(perspectives);
    (checkAccess as jest.Mock).mockReturnValue(Promise.resolve({ status: { allowed: true } }));
    const { result, rerender } = testHook(() => usePerspectives());

    await act(async () => {
      rerender();
    });

    expect(result.current).toEqual([
      {
        type: 'Perspective',
        properties: {
          id: 'dev-test',
          name: 'Test Developer',
          defaultPins: [{ kind: 'Deployments' }, { kind: 'Secret' }],
        },
      },
    ]);
  });

  it('should return only the enabled perspectives and the perspectives that satisfy the required accessreview checks that are set in the server flags for user with limited access', async () => {
    const perspectives: Perspective[] = [
      {
        id: 'dev',
        visibility: {
          state: PerspectiveVisibilityState.AccessReview,
          accessReview: {
            required: [
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
          state: PerspectiveVisibilityState.Enabled,
        },
      },
    ];
    window.SERVER_FLAGS.perspectives = JSON.stringify(perspectives);
    (checkAccess as jest.Mock).mockReturnValue(Promise.resolve({ status: { allowed: false } }));
    const { result, rerender } = testHook(() => usePerspectives());

    await act(async () => {
      rerender();
    });

    expect(result.current).toEqual([
      {
        type: 'Perspective',
        properties: {
          id: 'dev-test',
          name: 'Test Developer',
          defaultPins: [{ kind: 'Deployments' }, { kind: 'Secret' }],
        },
      },
    ]);
  });

  it('should not return perspective when required accessreview check throws an error', async () => {
    const perspectives: Perspective[] = [
      {
        id: 'dev',
        visibility: {
          state: PerspectiveVisibilityState.AccessReview,
          accessReview: {
            required: [
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
          state: PerspectiveVisibilityState.Enabled,
        },
      },
    ];
    window.SERVER_FLAGS.perspectives = JSON.stringify(perspectives);
    (checkAccess as jest.Mock).mockReturnValue(Promise.reject(new Error('Unexpected error')));
    const { result, rerender } = testHook(() => usePerspectives());

    await act(async () => {
      rerender();
    });

    expect(result.current).toEqual([
      {
        type: 'Perspective',
        properties: {
          id: 'dev-test',
          name: 'Test Developer',
          defaultPins: [{ kind: 'Deployments' }, { kind: 'Secret' }],
        },
      },
    ]);
  });

  it('should also return perspectives that are not configured', async () => {
    const perspectives: Perspective[] = [
      {
        id: 'dev',
        visibility: {
          state: PerspectiveVisibilityState.AccessReview,
          accessReview: {
            required: [
              {
                resource: 'namespaces',
                verb: 'list',
              },
            ],
          },
        },
      },
    ];
    window.SERVER_FLAGS.perspectives = JSON.stringify(perspectives);
    (checkAccess as jest.Mock).mockReturnValue(Promise.resolve({ status: { allowed: true } }));
    const { result, rerender } = testHook(() => usePerspectives());

    await act(async () => {
      rerender();
    });

    expect(result.current).toEqual([
      {
        type: 'Perspective',
        properties: {
          id: 'admin',
          name: 'Administrator',
        },
      },
      {
        type: 'Perspective',
        properties: {
          id: 'dev',
          name: 'Developer',
          defaultPins: [{ kind: 'ConfigMap' }, { kind: 'Secret' }],
        },
      },
      {
        type: 'Perspective',
        properties: {
          id: 'dev-test',
          name: 'Test Developer',
          defaultPins: [{ kind: 'Deployments' }, { kind: 'Secret' }],
        },
      },
    ]);
  });
});
