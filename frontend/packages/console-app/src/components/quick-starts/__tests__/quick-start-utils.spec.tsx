import { mockQuickStarts } from '../utils/quick-start-mocks';
import { getQuickStart } from '../utils/quick-start-utils';

describe('quick-start-utils', () => {
  it('should return the quick start corresponding to the id', () => {
    const mockID = mockQuickStarts[0].id;
    expect(getQuickStart(mockID).id === mockID).toBe(true);
  });
});
