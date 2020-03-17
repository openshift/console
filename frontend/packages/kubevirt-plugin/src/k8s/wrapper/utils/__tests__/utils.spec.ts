import * as _ from 'lodash';
import { ensurePath } from '../utils';

describe('utils ensurePath', () => {
  let testData = null;

  beforeEach(() => {
    testData = {
      color: 'blue',
      interval: {
        from: 5,
        to: 9,
      },
    };
  });

  it('ensures path', () => {
    ensurePath(testData, 'interval.metadata.created', {
      timestamp: '2020-03-05T09:54:22Z',
      by: { name: 'Jane', role: 'admin' },
    });

    expect(testData).toEqual({
      color: 'blue',
      interval: {
        from: 5,
        to: 9,
        metadata: {
          created: {
            timestamp: '2020-03-05T09:54:22Z',
            by: { name: 'Jane', role: 'admin' },
          },
        },
      },
    });
  });

  it('ensures path is idempotent', () => {
    const before = _.cloneDeep(testData);
    ensurePath(testData, 'interval', { from: 0, to: 3 });
    expect(testData).toEqual(before);
  });

  it('ensures path with array', () => {
    ensurePath(testData, 'interval.childInterval', []);
    expect(testData).toEqual({
      color: 'blue',
      interval: {
        from: 5,
        to: 9,
        childInterval: [],
      },
    });
  });
});
