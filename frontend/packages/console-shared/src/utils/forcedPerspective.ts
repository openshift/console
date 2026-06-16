import { STORAGE_PREFIX } from '../constants/common';

export const FORCED_PERSPECTIVE_LOCAL_STORAGE_KEY = `${STORAGE_PREFIX}/forced-perspective`;

export type ForcedPerspectiveStorageState = {
  perspectiveId: string;
  forced: boolean;
};

export type ForcedPerspectiveResult = {
  /** Whether all console.force-perspective hooks have finished evaluating. */
  loaded: boolean;
  /** The forced perspective identifier, or null when no perspective is forced. */
  perspectiveId: string | null;
};

export const getForcedPerspectiveFromStorage = (): ForcedPerspectiveStorageState | null => {
  try {
    const value = window.localStorage.getItem(FORCED_PERSPECTIVE_LOCAL_STORAGE_KEY);
    if (!value) {
      return null;
    }
    const parsed = JSON.parse(value) as ForcedPerspectiveStorageState;
    if (parsed?.forced && parsed?.perspectiveId) {
      return parsed;
    }
    return null;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Could not read forced perspective from localStorage', e);
    return null;
  }
};

/** Read the last known forced perspective synchronously from localStorage. */
export const getInitialForcedPerspectiveResult = (): ForcedPerspectiveResult => {
  const cached = getForcedPerspectiveFromStorage();
  if (cached?.forced && cached.perspectiveId) {
    return { loaded: true, perspectiveId: cached.perspectiveId };
  }
  return { loaded: false, perspectiveId: null };
};

export const setForcedPerspectiveInStorage = (state: ForcedPerspectiveStorageState): void => {
  try {
    window.localStorage.setItem(FORCED_PERSPECTIVE_LOCAL_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Could not persist forced perspective to localStorage', e);
  }
};

export const clearForcedPerspectiveFromStorage = (): void => {
  try {
    window.localStorage.removeItem(FORCED_PERSPECTIVE_LOCAL_STORAGE_KEY);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Could not clear forced perspective from localStorage', e);
  }
};
