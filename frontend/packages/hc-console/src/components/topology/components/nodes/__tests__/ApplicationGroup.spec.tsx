import { computeLabelLocation } from '../../groups/ApplicationGroup';

describe('ApplicationGroup', () => {
  it('should return the lowest point', () => {
    expect(computeLabelLocation([[0, 0, 0]])).toEqual([0, 0, 0]);
    expect(
      computeLabelLocation([
        [100, 10, 1000],
        [200, 30, 2000],
        [300, 20, 3000],
      ]),
    ).toEqual([200, 30, 2000]);
  });

  it('should return a point whose x is the middle of similar low points', () => {
    expect(
      computeLabelLocation([
        [100, 10, 1000],
        [200, 30, 2000], // low
        [300, 20, 3000],
        [500, 30, 2500], // low with largest size
        [100, 10, 1000],
        [200, 30, 1500], // low
      ]),
    ).toEqual([350, 30, 2500]);
  });
});
