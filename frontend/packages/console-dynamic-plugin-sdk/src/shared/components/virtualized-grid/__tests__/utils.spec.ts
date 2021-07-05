import { getItemsAndRowCount } from '../utils';

describe('virtualized-grid-utils', () => {
  it('should return row count, itemCount, headerRows based on itemcount and column count', () => {
    const data = {
      header1: [{}, {}, {}, {}, {}],
    };
    const result1 = getItemsAndRowCount(data, 3);
    expect(result1.rowCount).toEqual(3);
    expect(result1.items).toEqual(['header1', null, null, {}, {}, {}, {}, {}, null]);
    expect(result1.headerRows).toEqual([0]);

    const data2 = {
      header1: [{}],
      header2: [{}, {}],
    };
    const result2 = getItemsAndRowCount(data2, 2);
    expect(result2.rowCount).toEqual(4);
    expect(result2.items).toEqual(['header1', null, {}, null, 'header2', null, {}, {}]);
    expect(result2.headerRows).toEqual([0, 2]);

    const data3 = {
      header1: [],
      header2: [{}],
    };

    const result3 = getItemsAndRowCount(data3, 1);
    expect(result3.rowCount).toEqual(2);
    expect(result3.items).toEqual(['header2', {}]);
    expect(result3.headerRows).toEqual([0]);
  });
});
