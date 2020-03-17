import * as _ from 'lodash';
import { omitEmpty } from '../common';

describe('omitEmpty', () => {
  let testData = null;
  let enhancedData = null;

  beforeEach(() => {
    testData = {
      color: 'blue',
      interval: {
        from: 5,
        to: 9,
      },
    };

    enhancedData = {
      ..._.cloneDeep(testData),
      lizards: {
        sally: {
          age: 5,
          location: undefined,
        },
        jerry: null,
        john: undefined,
      },
      parrots: [
        '',
        {
          name: 'captain',
          children: [undefined, null, { name: 'Dan', age: undefined, nickName: '' }],
        },
        { name: 'Casey' },
      ],
    };
  });

  it('does not change original', () => {
    const before = _.cloneDeep(testData);

    omitEmpty(testData);
    expect(testData).toEqual(before);
  });

  it('removes undefined', () => {
    omitEmpty(enhancedData, true);
    expect(enhancedData).toEqual({
      ...testData,
      lizards: {
        sally: {
          age: 5,
        },
        jerry: null,
      },
      parrots: [
        '',
        { name: 'captain', children: [null, { name: 'Dan', nickName: '' }] },
        { name: 'Casey' },
      ],
    });
  });

  it('removes null and undefined', () => {
    omitEmpty(enhancedData);
    expect(enhancedData).toEqual({
      ...testData,
      lizards: {
        sally: {
          age: 5,
        },
      },
      parrots: [
        '',
        { name: 'captain', children: [{ name: 'Dan', nickName: '' }] },
        { name: 'Casey' },
      ],
    });
  });
});
