import {
  isCloudShellExpanded,
  isCloudShellActive,
  cloudShellReducerName,
} from '../cloud-shell-selectors';

describe('Cloud shell selectors', () => {
  it('should select isExpanded', () => {
    expect(isCloudShellExpanded({} as any)).toBe(false);
    expect(
      isCloudShellExpanded({
        plugins: { console: { [cloudShellReducerName]: { isExpanded: true } } },
      } as any),
    ).toBe(true);
  });

  it('should select isActive', () => {
    expect(isCloudShellActive({} as any)).toBe(false);
    expect(
      isCloudShellActive({
        plugins: { console: { [cloudShellReducerName]: { isActive: true } } },
      } as any),
    ).toBe(true);
  });
});
