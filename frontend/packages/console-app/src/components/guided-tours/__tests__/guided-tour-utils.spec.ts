import { mockGuidedTours } from '../utils/guided-tour-mocks';
import { getGuidedTour } from '../utils/guided-tour-utils';

describe('guided-tour-utils', () => {
  it('should return the guided tour corresponding to the id', () => {
    const mockID = mockGuidedTours[0].id;
    expect(getGuidedTour(mockID).id === mockID).toBe(true);
  });
});
