import { useSelector } from 'react-redux';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk/src/api/useResolvedExtensions';
import { useUserSettingsCompatibility } from '@console/shared/src/hooks/useUserSettingsCompatibility';
import { testHook } from '@console/shared/src/test-utils/hooks-utils';
import { TourActions } from '../const';
import { tourReducer, useTourValuesForContext, useTourStateForPerspective } from '../tour-context';
import { TourDataType } from '../type';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

jest.mock('@console/dynamic-plugin-sdk/src/api/useResolvedExtensions', () => ({
  useResolvedExtensions: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useUserSettingsCompatibility', () => ({
  useUserSettingsCompatibility: jest.fn(),
}));

jest.mock('@console/dynamic-plugin-sdk/src/perspective/useActivePerspective', () => ({
  default: () => ['dev', jest.fn()],
}));

const useSelectorMock = useSelector as jest.Mock;
const useResolvedExtensionsMock = useResolvedExtensions as jest.Mock;
const useUserSettingsCompatibilityMock = useUserSettingsCompatibility as jest.Mock;

describe('guided-tour-context', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('tour-reducer', () => {
    let mockState;
    beforeEach(() => {
      mockState = { startTour: false, completedTour: false, stepNumber: 2 };
    });

    it('should return startTour as true for StartAction', () => {
      const result = tourReducer(mockState, { type: TourActions.start });
      expect(result).toEqual({
        startTour: true,
        completedTour: false,
        stepNumber: 0,
      });
    });

    it('should return increment in stepNumber  for next action', () => {
      const result = tourReducer(mockState, { type: TourActions.next });
      expect(result.stepNumber).toEqual(mockState.stepNumber + 1);
    });

    it('should return decrease in stepNumber  for back action', () => {
      const result = tourReducer(mockState, { type: TourActions.back });
      expect(result.stepNumber).toEqual(mockState.stepNumber - 1);
    });

    it('should return completedTour as true for complete action', () => {
      const result = tourReducer(mockState, { type: TourActions.complete });
      expect(result).toEqual({
        startTour: false,
        completedTour: true,
        stepNumber: 0,
      });
    });
  });

  describe('guided-tour-context-hook', () => {
    let mockTour: TourDataType;
    let mockTourExtension;
    beforeEach(() => {
      mockTour = {
        intro: { heading: 'a', content: 'c' },
        steps: [
          { flags: ['A', 'B'], heading: 'step1', content: 'step1 content' },
          { flags: ['A'], heading: 'g', content: 'h' },
        ],
        end: { heading: 'b', content: 'd' },
      };

      mockTourExtension = [
        [
          {
            type: 'INTERNAL_DO_NOT_USE.guided-tour',
            properties: {
              perspective: 'dev',
              tour: mockTour,
            },
          },
        ],
      ];
    });

    it('should return context values from the hook', () => {
      useSelectorMock
        .mockReturnValueOnce({ A: true, B: false })
        .mockReturnValueOnce({ A: true, B: false });
      useResolvedExtensionsMock.mockReturnValue(mockTourExtension);
      // Mock useUserSettingsCompatibility to return { completed: false } for the tour state
      useUserSettingsCompatibilityMock.mockReturnValue([
        { dev: { completed: false } },
        () => null,
        true,
      ]);
      testHook(() => {
        const contextValue = useTourValuesForContext();
        const { tourState, tour, totalSteps } = contextValue;
        expect(tourState).toEqual({
          startTour: true,
          completedTour: false,
          stepNumber: 0,
        });
        expect(tour).toEqual({
          ...mockTour,
          steps: [{ flags: ['A'], heading: 'g', content: 'h' }],
        });
        expect(totalSteps).toEqual(1);
      });
    });

    it('should return tour null from the hook', () => {
      useSelectorMock
        .mockReturnValueOnce({ A: true, B: false })
        .mockReturnValueOnce({ A: true, B: false });
      useResolvedExtensionsMock.mockReturnValue([[]]);
      useUserSettingsCompatibilityMock.mockReturnValue([
        { dev: { completed: false } },
        () => null,
        true,
      ]);
      testHook(() => {
        const contextValue = useTourValuesForContext();
        const { tourState, tour, totalSteps } = contextValue;
        expect(tourState).toEqual(undefined);
        expect(tour).toEqual(null);
        expect(totalSteps).toEqual(undefined);
      });
    });

    it('should return null from the hook if tour is available but data isnot loaded', () => {
      useSelectorMock
        .mockReturnValueOnce({ A: true, B: false })
        .mockReturnValueOnce({ A: true, B: false });
      useResolvedExtensionsMock.mockReturnValue(mockTourExtension);
      // Mock useUserSettingsCompatibility with loaded: false
      useUserSettingsCompatibilityMock.mockReturnValue([
        { dev: { completed: false } },
        () => null,
        false,
      ]);
      testHook(() => {
        const contextValue = useTourValuesForContext();
        const { tourState, tour, totalSteps } = contextValue;
        expect(tourState).toEqual(undefined);
        expect(tour).toEqual(null);
        expect(totalSteps).toEqual(undefined);
      });
    });
  });

  describe('useTourStatePerspective', () => {
    it('should return data based on the perspective passed as prop', () => {
      useUserSettingsCompatibilityMock.mockReturnValue([
        { dev: { a: true }, admin: { a: false } },
        () => null,
        true,
      ]);
      testHook(() => {
        const [state, , loaded] = useTourStateForPerspective('dev');
        expect(state).toEqual({ a: true });
        expect(loaded).toEqual(true);
      });
    });
  });
});
