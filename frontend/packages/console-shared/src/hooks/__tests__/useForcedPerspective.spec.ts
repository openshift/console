import { renderHook, waitFor } from '@testing-library/react';
import { isForcePerspective, useResolvedExtensions } from '@console/dynamic-plugin-sdk';
import { FORCED_PERSPECTIVE_LOCAL_STORAGE_KEY } from '../../utils/forcedPerspective';
import { useForcedPerspective } from '../useForcedPerspective';

jest.mock('@console/dynamic-plugin-sdk', () => ({
  isForcePerspective: jest.fn(),
  useResolvedExtensions: jest.fn(),
}));

const useResolvedExtensionsMock = useResolvedExtensions as jest.Mock;

describe('useForcedPerspective', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useResolvedExtensionsMock.mockReturnValue([[], false]);
  });

  it('should return unloaded when extensions are not resolved and localStorage is empty', () => {
    const { result } = renderHook(() => useForcedPerspective());
    expect(result.current).toEqual({ loaded: false, perspectiveId: null });
  });

  it('should return null when no force-perspective extensions exist', async () => {
    useResolvedExtensionsMock.mockReturnValue([[], true]);

    const { result } = renderHook(() => useForcedPerspective());

    await waitFor(() => {
      expect(result.current).toEqual({ loaded: true, perspectiveId: null });
    });
  });

  it('should return forced perspective when a hook evaluates to true', async () => {
    useResolvedExtensionsMock.mockReturnValue([
      [
        {
          type: 'console.force-perspective',
          properties: {
            perspectiveId: 'virtualization-perspective',
            useForcePerspective: () => [true, false],
          },
        },
      ],
      true,
    ]);

    const { result } = renderHook(() => useForcedPerspective());

    await waitFor(() => {
      expect(result.current).toEqual({
        loaded: true,
        perspectiveId: 'virtualization-perspective',
      });
    });
    expect(window.localStorage.getItem(FORCED_PERSPECTIVE_LOCAL_STORAGE_KEY)).toBe(
      JSON.stringify({
        perspectiveId: 'virtualization-perspective',
        forced: true,
      }),
    );
  });

  it('should return cached forced perspective while extensions are unresolved', () => {
    window.localStorage.setItem(
      FORCED_PERSPECTIVE_LOCAL_STORAGE_KEY,
      JSON.stringify({
        perspectiveId: 'virtualization-perspective',
        forced: true,
      }),
    );
    useResolvedExtensionsMock.mockReturnValue([[], false]);

    const { result } = renderHook(() => useForcedPerspective());

    expect(result.current).toEqual({
      loaded: true,
      perspectiveId: 'virtualization-perspective',
    });
  });

  it('should return cached forced perspective while extension hooks are evaluating', () => {
    window.localStorage.setItem(
      FORCED_PERSPECTIVE_LOCAL_STORAGE_KEY,
      JSON.stringify({
        perspectiveId: 'virtualization-perspective',
        forced: true,
      }),
    );
    useResolvedExtensionsMock.mockReturnValue([
      [
        {
          type: 'console.force-perspective',
          properties: {
            perspectiveId: 'virtualization-perspective',
            useForcePerspective: () => [false, true],
          },
        },
      ],
      true,
    ]);

    const { result } = renderHook(() => useForcedPerspective());

    expect(result.current).toEqual({
      loaded: true,
      perspectiveId: 'virtualization-perspective',
    });
  });

  it('should keep cached forced perspective when extensions resolve empty before plugins load', () => {
    window.localStorage.setItem(
      FORCED_PERSPECTIVE_LOCAL_STORAGE_KEY,
      JSON.stringify({
        perspectiveId: 'virtualization-perspective',
        forced: true,
      }),
    );
    useResolvedExtensionsMock.mockReturnValue([[], true]);

    const { result } = renderHook(() => useForcedPerspective());

    expect(result.current).toEqual({
      loaded: true,
      perspectiveId: 'virtualization-perspective',
    });
    expect(window.localStorage.getItem(FORCED_PERSPECTIVE_LOCAL_STORAGE_KEY)).toBe(
      JSON.stringify({
        perspectiveId: 'virtualization-perspective',
        forced: true,
      }),
    );
  });

  it('should clear localStorage when forcing is no longer active', async () => {
    window.localStorage.setItem(
      FORCED_PERSPECTIVE_LOCAL_STORAGE_KEY,
      JSON.stringify({
        perspectiveId: 'virtualization-perspective',
        forced: true,
      }),
    );
    useResolvedExtensionsMock.mockReturnValue([
      [
        {
          type: 'console.force-perspective',
          properties: {
            perspectiveId: 'virtualization-perspective',
            useForcePerspective: () => [false, false],
          },
        },
      ],
      true,
    ]);

    const { result } = renderHook(() => useForcedPerspective());

    await waitFor(() => {
      expect(result.current).toEqual({ loaded: true, perspectiveId: null });
    });
    expect(window.localStorage.getItem(FORCED_PERSPECTIVE_LOCAL_STORAGE_KEY)).toBeNull();
  });

  it('should use the first extension that forces a perspective', async () => {
    useResolvedExtensionsMock.mockReturnValue([
      [
        {
          type: 'console.force-perspective',
          properties: {
            perspectiveId: 'admin',
            useForcePerspective: () => [false, false],
          },
        },
        {
          type: 'console.force-perspective',
          properties: {
            perspectiveId: 'virtualization-perspective',
            useForcePerspective: () => [true, false],
          },
        },
      ],
      true,
    ]);

    const { result } = renderHook(() => useForcedPerspective());

    await waitFor(() => {
      expect(result.current).toEqual({
        loaded: true,
        perspectiveId: 'virtualization-perspective',
      });
    });
  });

  it('should resolve force-perspective extensions via isForcePerspective', () => {
    renderHook(() => useForcedPerspective());
    expect(useResolvedExtensionsMock).toHaveBeenCalledWith(isForcePerspective);
  });
});
