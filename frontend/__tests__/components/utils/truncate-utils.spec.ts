import {
  truncateMiddle,
  shouldTruncate,
  TruncateOptions,
} from '../../../public/components/utils/truncate-middle';

const testTruncateText = 'ThisTextShouldBeTruncatedByDefault';

describe('truncateMiddle: ', () => {
  it('should truncate to 20 characters, in the middle, with ellipse by default', () => {
    expect(shouldTruncate(testTruncateText)).toBe(true);
    const truncateResult = truncateMiddle(testTruncateText);
    const splits = truncateResult.split('\u2026');
    expect(truncateResult.length).toBe(20);
    expect(splits[0].length).toBeGreaterThan(1);
    expect(splits[1].length).toBeGreaterThan(1);
  });

  it('should honor setting the length', () => {
    const options: TruncateOptions = { length: 50 };
    expect(shouldTruncate(testTruncateText, options)).toBe(false);
    const truncateResult = truncateMiddle(testTruncateText, options);
    const splits = truncateResult.split('\u2026');
    expect(truncateResult.length).toBe(testTruncateText.length);
    expect(splits.length).toBe(1);
  });

  it('should honor truncating at the end', () => {
    const options: TruncateOptions = { truncateEnd: true };
    expect(shouldTruncate(testTruncateText, options)).toBe(true);
    const truncateResult = truncateMiddle(testTruncateText, options);
    const splits = truncateResult.split('\u2026');
    expect(truncateResult.length).toBe(20);
    expect(splits[0].length).toBe(19);
    expect(splits[1].length).toBe(0);
  });

  it('should honor the omission text', () => {
    const options: TruncateOptions = { omission: 'zzz' };
    expect(shouldTruncate(testTruncateText, options)).toBe(true);
    const truncateResult = truncateMiddle(testTruncateText, options);
    const splits = truncateResult.split('zzz');
    expect(truncateResult.length).toBe(20);
    expect(splits.length).toBe(2);
  });
});
