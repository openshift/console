import * as _ from 'lodash';
import { deepForOwn } from '../object';

type TestValue = { test: number };

const testPredicate = (value): value is TestValue =>
  _.isPlainObject(value) &&
  _.isEqual(Object.getOwnPropertyNames(value), ['test']) &&
  typeof value.test === 'number';

describe('deepForOwn', () => {
  it('recursively iterates over matching property values', () => {
    const obj = {
      foo: { test: 1 },
      bar: {
        qux: { test: 2 },
        mux: { test: 3, boom: true },
      },
    };

    const valueCallback = jest.fn();

    deepForOwn<TestValue>(obj, testPredicate, valueCallback);

    expect(valueCallback.mock.calls.length).toBe(2);
    expect(valueCallback.mock.calls[0]).toEqual([{ test: 1 }, 'foo', obj]);
    expect(valueCallback.mock.calls[1]).toEqual([{ test: 2 }, 'qux', obj.bar]);
  });

  it('does not iterate over array elements', () => {
    const obj = {
      foo: [{ test: 1 }],
      bar: {
        qux: [{ test: 2 }],
        mux: [{ test: 3, boom: true }],
      },
    };

    const valueCallback = jest.fn();

    deepForOwn<TestValue>(obj, testPredicate, valueCallback);

    expect(valueCallback).not.toHaveBeenCalled();
  });
});
