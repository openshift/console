import { useUserPreference } from '@console/shared/src/hooks/useUserPreference';
import { useShowAddCardItemDetails } from '../useShowAddCardItemDetails';

jest.mock('@console/shared/src/hooks/useUserPreference', () => ({
  useUserPreference: jest.fn(),
}));

describe('useShowAddCardItemDetails', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should return true if useUserPreference returns true for loaded', () => {
    (useUserPreference as jest.Mock).mockReturnValue([true, jest.fn(), true]);
    expect(useShowAddCardItemDetails()[0]).toBe(true);
  });

  it('should return false if useUserPreference returns false for loaded', () => {
    (useUserPreference as jest.Mock).mockReturnValue([true, jest.fn(), false]);
    expect(useShowAddCardItemDetails()[0]).toBe(false);
  });
});
