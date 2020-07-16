import { FeatureState } from '@console/internal/reducers/features';
import { TOUR_LOCAL_STORAGE_KEY } from './const';
import { Step } from './type';

/**
 * Local Storage utils
 */

type TourLocalStorageType = {
  completed: boolean;
};

type TourLocalStorageData = {
  [key: string]: TourLocalStorageType;
};

const getTourLocalStorageData = (): TourLocalStorageData =>
  JSON.parse(localStorage.getItem(TOUR_LOCAL_STORAGE_KEY));

const setTourLocalStorageData = (data: TourLocalStorageData) =>
  localStorage.setItem(TOUR_LOCAL_STORAGE_KEY, JSON.stringify(data));

const hasLocalStorageKey = (key: string): boolean => localStorage.getItem(key) !== null;

const initializeTourLocalStorage = (perspective: string): TourLocalStorageType => {
  const data = { completed: false };
  setTourLocalStorageData({ [perspective]: data });
  return data;
};

const initializeTourLocalStorageForPerspective = (perspective: string): TourLocalStorageType => {
  const data = getTourLocalStorageData();
  data[perspective] = { completed: false };
  setTourLocalStorageData(data);
  return data[perspective];
};

export const getTourLocalStorageForPerspective = (perspective: string): TourLocalStorageType => {
  if (!hasLocalStorageKey(TOUR_LOCAL_STORAGE_KEY)) return initializeTourLocalStorage(perspective);
  const data = getTourLocalStorageData();
  if (data.hasOwnProperty(perspective)) {
    return data[perspective];
  }
  return initializeTourLocalStorageForPerspective(perspective);
};

export const setTourCompletionLocalStorageDataForPerspective = (
  perspective: string,
  completed: boolean,
): void => {
  const data = getTourLocalStorageData();
  setTourLocalStorageData({ ...data, [perspective]: { ...data[perspective], completed } });
};

/**
 * filter utils
 */

export const filterTourBasedonPermissionAndFlag = (steps: Step[], flags: FeatureState): Step[] =>
  steps.reduce((acc: Step[], step: Step) => {
    const { flags: stepFlags, access, selector } = step;
    if (stepFlags && stepFlags.filter((flag) => !flags[flag]).length > 0) return acc;
    if (access && !access()) return acc;
    // if the access and flag both check passes but the element is not present in the dom
    if (selector && !document.querySelector(selector)) return acc;
    acc.push(step);
    return acc;
  }, [] as Step[]);
