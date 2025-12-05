import {
  createContext,
  useReducer,
  useState,
  Reducer,
  Dispatch,
  ReducerAction,
  useEffect,
  useCallback,
} from 'react';
import { pick, union, isEqual } from 'lodash';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk/src/api/useResolvedExtensions';
import {
  INTERNAL_DO_NOT_USE_isGuidedTour as isGuidedTour,
  INTERNAL_DO_NOT_USE_GuidedTour as GuidedTour,
} from '@console/dynamic-plugin-sdk/src/extensions/guided-tour';
import { getFlagsObject } from '@console/internal/reducers/features';
import { RootState } from '@console/internal/redux';
import { useTranslatedExtensions } from '@console/plugin-sdk/src/utils/useTranslatedExtensions';
import { useUserSettingsCompatibility } from '@console/shared/src/hooks/useUserSettingsCompatibility';
import { TourActions, TOUR_LOCAL_STORAGE_KEY } from './const';
import { TourDataType, Step } from './type';
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

const TOUR_CONFIGMAP_KEY = `console.guidedTour`;

export const useTourStateForPerspective = (
  perspective: string,
): [TourLocalStorageType, (completed: boolean) => void, boolean] => {
  const [tourLocalState, setTourLocalState, loaded] = useUserSettingsCompatibility<
    TourLocalStorageData
  >(TOUR_CONFIGMAP_KEY, TOUR_LOCAL_STORAGE_KEY, { [perspective]: { completed: false } });
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
  const [perspective, setPerspective] = useState<string>(activePerspective);
  const tourExtension = useTranslatedTourExtensions();
  const tour = tourExtension.find(({ properties }) => properties.perspective === perspective);
  const selectorSteps = tour?.properties?.tour?.steps ?? [];
  const flags = useSelector(
    (state: RootState) => getRequiredFlagsByTour(state, selectorSteps),
    isEqual,
  );
  const [tourCompletionState, setTourCompletionState, loaded] = useTourStateForPerspective(
    activePerspective,
  );
  const completed = tourCompletionState?.completed;
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

  useEffect(() => {
    tourDispatch({ type: TourActions.initialize, payload: { completed } });
    setPerspective(activePerspective);
    // only run effect when the active perspective changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePerspective, loaded]);

  if (!tour || !loaded) return { tour: null };
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
