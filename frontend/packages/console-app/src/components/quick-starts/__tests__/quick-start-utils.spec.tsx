import { getQuickStartByName } from '../utils/quick-start-utils';
import { allQuickStarts } from '../data/quick-start-data';

describe('quick-start-utils', () => {
  it('should return the quick start corresponding to the id', () => {
    const mockID = allQuickStarts[0].metadata.name;
    expect(getQuickStartByName(mockID).metadata.name === mockID).toBe(true);
  });
});
