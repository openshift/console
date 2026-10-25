import type { WatchK8sResource } from '../../../../extensions/console-types';
import { getReduxData } from '../k8s-watcher';

describe('getReduxData', () => {
  it('should return null for falsy values', () => {
    const resource: WatchK8sResource = {};
    expect(getReduxData(null, resource)).toBe(null);
    expect(getReduxData(undefined, resource)).toBe(null);
  });

  it('should convert a Record to an array for isList: true', () => {
    const data = { a: { a: 1 }, b: { b: 2 }, c: { c: 3 } };
    const resource: WatchK8sResource = { isList: true };
    expect(getReduxData(data, resource)).toEqual([{ a: 1 }, { b: 2 }, { c: 3 }]);
  });

  it('should return data directly for non-list resources', () => {
    const data = { a: 1, b: 2, c: 3 };
    const resource: WatchK8sResource = {};
    expect(getReduxData(data, resource)).toEqual({ a: 1, b: 2, c: 3 });
  });

  it('should return the same reference for non-list data', () => {
    const data = { a: 1, b: 2, c: 3 };
    const resource: WatchK8sResource = {};
    const firstTime = getReduxData(data, resource);
    const secondTime = getReduxData(data, resource);
    expect(firstTime).toBe(secondTime);
  });

  it('should preserve element references in list data', () => {
    const item1 = { a: 1 };
    const item2 = { b: 2 };
    const item3 = { c: 3 };
    const data = { x: item1, y: item2, z: item3 };
    const resource: WatchK8sResource = { isList: true };
    const result = getReduxData(data, resource);
    expect(result).toContain(item1);
    expect(result).toContain(item2);
    expect(result).toContain(item3);
  });

  it('should return different results for isList true and false', () => {
    const data = { a: { a: 1 }, b: { b: 2 }, c: { c: 3 } };
    const listResult = getReduxData(data, { isList: true });
    const noListResult = getReduxData(data, { isList: false });

    expect(listResult).toEqual([{ a: 1 }, { b: 2 }, { c: 3 }]);
    expect(noListResult).toEqual({ a: { a: 1 }, b: { b: 2 }, c: { c: 3 } });
  });

  it('should return the input array as-is for list data that is already an array', () => {
    const data = [{ a: 1 }, { b: 2 }, { c: 3 }];
    const resource: WatchK8sResource = { isList: true };
    const result = getReduxData(data, resource);
    expect(result).toBe(data);
  });
});
