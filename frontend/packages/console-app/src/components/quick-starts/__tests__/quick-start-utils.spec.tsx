import { allQuickStarts } from '../data/quick-start-test-data';
import { getQuickStartByName, isDisabledQuickStart } from '../utils/quick-start-utils';

describe('quick-start-utils', () => {
  it('should return the quick start corresponding to the id for getQuickStartByName function', () => {
    const mockID = allQuickStarts[0].metadata.name;
    const quickStart = getQuickStartByName(mockID);
    expect(quickStart.metadata.name === mockID).toBe(true);
  });

  it('should filter out disabled quick starts', () => {
    const disabledQuickStarts = [allQuickStarts[0].metadata.name]; // setting allQuickStart[0] as disabled
    expect(isDisabledQuickStart(allQuickStarts[1], disabledQuickStarts)).toBe(false);
    expect(isDisabledQuickStart(allQuickStarts[0], disabledQuickStarts)).toBe(true);
  });
});
