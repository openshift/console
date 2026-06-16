import {
  clearForcedPerspectiveFromStorage,
  FORCED_PERSPECTIVE_LOCAL_STORAGE_KEY,
  getForcedPerspectiveFromStorage,
  getInitialForcedPerspectiveResult,
  setForcedPerspectiveInStorage,
} from '../forcedPerspective';

describe('forcedPerspective utils', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('should persist and read forced perspective state', () => {
    setForcedPerspectiveInStorage({
      perspectiveId: 'virtualization-perspective',
      forced: true,
    });

    expect(getForcedPerspectiveFromStorage()).toEqual({
      perspectiveId: 'virtualization-perspective',
      forced: true,
    });
    expect(window.localStorage.getItem(FORCED_PERSPECTIVE_LOCAL_STORAGE_KEY)).toBe(
      JSON.stringify({
        perspectiveId: 'virtualization-perspective',
        forced: true,
      }),
    );
  });

  it('should clear forced perspective state', () => {
    setForcedPerspectiveInStorage({
      perspectiveId: 'virtualization-perspective',
      forced: true,
    });

    clearForcedPerspectiveFromStorage();

    expect(getForcedPerspectiveFromStorage()).toBeNull();
  });

  it('should return initial forced perspective result from localStorage', () => {
    setForcedPerspectiveInStorage({
      perspectiveId: 'virtualization-perspective',
      forced: true,
    });

    expect(getInitialForcedPerspectiveResult()).toEqual({
      loaded: true,
      perspectiveId: 'virtualization-perspective',
    });
  });

  it('should return unloaded initial result when localStorage is empty', () => {
    expect(getInitialForcedPerspectiveResult()).toEqual({
      loaded: false,
      perspectiveId: null,
    });
  });
});
