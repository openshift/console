import type { Reducer, Dispatch, ReducerAction } from 'react';
import { createContext, useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { pick, union, isEqual } from 'lodash';
import { createSelector } from 'reselect';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk/src/api/useResolvedExtensions';
import type { INTERNAL_DO_NOT_USE_GuidedTour as GuidedTour } from '@console/dynamic-plugin-sdk/src/extensions/guided-tour';
import { INTERNAL_DO_NOT_USE_isGuidedTour as isGuidedTour } from '@console/dynamic-plugin-sdk/src/extensions/guided-tour';
import { getFlagsObject } from '@console/internal/reducers/features';
import type { RootState } from '@console/internal/redux';
import { useTranslatedExtensions } from '@console/plugin-sdk/src/utils/useTranslatedExtensions';
import { INTEGRATION_TEST_USER_AGENT } from '@console/shared/src/constants/common';
import { useConsoleSelector } from '@console/shared/src/hooks/useConsoleSelector';
import { useUserPreference } from '@console/shared/src/hooks/useUserPreference';
import { TourActions } from './const';
import type { TourDataType, Step } from './type';
import { filterTourBasedonPermissionAndFlag } from './utils';

type TourStateAction = { type: TourActions; payload?: { completed?: boolean } };
export const tourReducer = (state: TourState, action: TourStateAction) => {
  const { stepNumber } = state;
  switch (action.type) {
    case TourActions.initialize:
      return {
        completedTour: action.payload?.completed,
        stepNumber: 0,
        startTour: !action.payload?.completed,
      };
    case TourActions.start:
      return { startTour: true, completedTour: false, stepNumber: 0 };
    case TourActions.next:
      return {
        ...state,
        startTour: false,
        stepNumber: stepNumber + 1,
      };
    case TourActions.back:
      return {
        ...state,
        stepNumber: stepNumber - 1,
      };
    case TourActions.complete:
      return { ...state, completedTour: true, stepNumber: 0 };
    default:
      return state;
  }
};

type TourReducer = Reducer<TourState, TourStateAction>;

type TourContextType = {
  tourState?: TourState;
  tourDispatch?: Dispatch<ReducerAction<TourReducer>>;
  tour?: TourDataType;
  totalSteps?: number;
  onComplete?: () => void;
};

export type TourState = {
  stepNumber: number;
  startTour?: boolean;
  completedTour?: boolean;
};

export const TourContext = createContext<TourContextType>({});

export const TourContextProvider = TourContext.Provider;

const getRequiredFlagsFromTour = (steps: Step[]) =>
  steps.reduce((allFlags, { flags }) => (flags ? union(allFlags, flags) : allFlags), []);

const getRequiredFlagsByTour = createSelector(
  (state: RootState) => getFlagsObject(state),
  (_, steps: Step[]) => getRequiredFlagsFromTour(steps),
  (flags, requiredFlags) => pick(flags, requiredFlags),
);

type TourLocalStorageType = {
  completed: boolean;
};

type TourLocalStorageData = {
  [key: string]: TourLocalStorageType;
};

const TOUR_USER_PREFERENCE_KEY = `console.guidedTour`;

export const useTourStateForPerspective = (
  perspective: string,
): [TourLocalStorageType, (completed: boolean) => void, boolean] => {
  const [tourLocalState, setTourLocalState, loaded] = useUserPreference<TourLocalStorageData>(
    TOUR_USER_PREFERENCE_KEY,
    { [perspective]: { completed: false } },
  );
  useEffect(() => {
    if (loaded && !tourLocalState.hasOwnProperty(perspective)) {
      setTourLocalState((state) => ({ ...state, [perspective]: { completed: false } }));
    }
    // only run effect when the active perspective changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perspective, loaded]);
  return [
    tourLocalState?.[perspective],
    useCallback(
      (completed: boolean) => {
        setTourLocalState((state) => {
          return { ...state, [perspective]: { ...state[perspective], completed } };
        });
      },
      [perspective, setTourLocalState],
    ),
    loaded,
  ];
};

/**
 * Hook to get translated guided tour extensions.
 *
 * As the translated strings of format `%namespace~string%` are behind a codeRef,
 * `useResolvedExtensions` does not translate the extensions.
 *
 * `useTranslatedExtensions` utility is only called in `useExtensions`. We do not
 * have the tour strings at this point as the codeRef is not resolved yet.
 */
const useTranslatedTourExtensions = () => {
  const [tourExtensionsRaw] = useResolvedExtensions<GuidedTour>(isGuidedTour);
  return useTranslatedExtensions(tourExtensionsRaw);
};

export const useTourValuesForContext = (): TourContextType => {
  const [activePerspective] = useActivePerspective();
  const tourExtension = useTranslatedTourExtensions();
  const tour = tourExtension.find(({ properties }) => properties.perspective === activePerspective);
  const selectorSteps = tour?.properties?.tour?.steps ?? [];
  const flags = useConsoleSelector(
    (state) => getRequiredFlagsByTour(state, selectorSteps),
    isEqual,
  );
  const [tourCompletionState, setTourCompletionState, loaded] = useTourStateForPerspective(
    activePerspective,
  );
  const isIntegrationTest = window.navigator.userAgent === INTEGRATION_TEST_USER_AGENT;
  const completed = tourCompletionState?.completed || isIntegrationTest;
  const onComplete = () => {
    if (completed === false) {
      setTourCompletionState(true);
    }
  };
  const [tourState, tourDispatch] = useReducer<TourReducer>(tourReducer, {
    completedTour: completed,
    stepNumber: 0,
    startTour: !completed,
  });

  const [initializedWithLoadedData, setInitializedWithLoadedData] = useState(false);
  const prevPerspective = useRef(activePerspective);
  if (prevPerspective.current !== activePerspective) {
    prevPerspective.current = activePerspective;
    if (initializedWithLoadedData) {
      setInitializedWithLoadedData(false);
    }
  }
  useEffect(() => {
    if (loaded) {
      tourDispatch({ type: TourActions.initialize, payload: { completed } });
      setInitializedWithLoadedData(true);
    }
  }, [activePerspective, completed, loaded]);

  if (!tour || !loaded || !initializedWithLoadedData) return { tour: null };
  const {
    properties: {
      tour: { intro, steps: unfilteredSteps, end },
    },
  } = tour;
  const steps = filterTourBasedonPermissionAndFlag(unfilteredSteps, flags);
  return {
    tourState,
    tourDispatch,
    tour: { intro, steps, end },
    totalSteps: steps.length,
    onComplete,
  };
};
