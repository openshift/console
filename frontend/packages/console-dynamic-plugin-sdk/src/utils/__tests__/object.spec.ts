import * as _ from 'lodash';
import { deepForOwn } from '../object';

type TestValue = { test: number };

const testPredicate = (value): value is TestValue =>
  _.isPlainObject(value) &&
  _.isEqual(Object.getOwnPropertyNames(value), ['test']) &&
  typeof value.test === 'number';

describe('deepForOwn', () => {
  it('recursively executes callback for matching values', () => {
    const obj = {
      foo: { test: 1 },
      bar: [{ test: 2 }, { test: 3 }],
      baz: {
        qux: { test: 4 },
        mux: { test: 5, boom: [{ test: 6 }] },
      },
    };

    const valueCallback = jest.fn();

    deepForOwn<TestValue>(obj, testPredicate, valueCallback);

    expect(valueCallback.mock.calls.length).toBe(5);
    expect(valueCallback.mock.calls[0]).toEqual([{ test: 1 }, 'foo', obj]);
    expect(valueCallback.mock.calls[1]).toEqual([{ test: 2 }, '0', obj.bar]);
    expect(valueCallback.mock.calls[2]).toEqual([{ test: 3 }, '1', obj.bar]);
    expect(valueCallback.mock.calls[3]).toEqual([{ test: 4 }, 'qux', obj.baz]);
    expect(valueCallback.mock.calls[4]).toEqual([{ test: 6 }, '0', obj.baz.mux.boom]);
  });
});
