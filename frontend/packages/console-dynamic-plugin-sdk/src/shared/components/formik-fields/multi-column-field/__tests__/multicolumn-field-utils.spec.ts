import { getSpans } from '../multicolumn-field-utils';

describe('Multicolumn field utils', () => {
  it('should return single spans value', () => {
    const spans = getSpans(1);
    expect(spans).toEqual([12]);
  });
  it('should return 12 spans equally sized', () => {
    const spans = getSpans(12);
    expect(spans).toEqual([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
  });
  it('should return spans [3, 3, 2, 2, 2]', () => {
    const spans = getSpans(5);
    expect(spans).toEqual([3, 3, 2, 2, 2]);
  });
  it('should return spans [2, 2, 2, 2, 2, 1, 1]', () => {
    const spans = getSpans(7);
    expect(spans).toEqual([2, 2, 2, 2, 2, 1, 1]);
  });
  it('should return spans [2, 2, 2, 1, 1, 1, 1, 1, 1]', () => {
    const spans = getSpans(9);
    expect(spans).toEqual([2, 2, 2, 1, 1, 1, 1, 1, 1]);
  });
  it('should return spans [4, 4, 4]', () => {
    const spans = getSpans(3);
    expect(spans).toEqual([4, 4, 4]);
  });
});
