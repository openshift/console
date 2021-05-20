import { useUserSettings } from '@console/shared/src/hooks/useUserSettings';
import { useShowAddCardItemDetails } from '../useShowAddCardItemDetails';

jest.mock('@console/shared/src/hooks/useUserSettings', () => ({
  useUserSettings: jest.fn(),
}));

describe('useShowAddCardItemDetails', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should return true if useUserSettings returns true for loaded', () => {
    (useUserSettings as jest.Mock).mockReturnValue([true, jest.fn(), true]);
    expect(useShowAddCardItemDetails()[0]).toBe(true);
  });

  it('should return false if useUserSettings returns false for loaded', () => {
    (useUserSettings as jest.Mock).mockReturnValue([true, jest.fn(), false]);
    expect(useShowAddCardItemDetails()[0]).toBe(false);
  });
});
