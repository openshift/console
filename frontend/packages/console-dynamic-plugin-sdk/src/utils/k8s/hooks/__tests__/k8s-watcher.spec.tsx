import {
  List as ImmutableList,
  Stack as ImmutableStack,
  Set as ImmutableSet,
  OrderedSet as ImmutableOrderedSet,
  Map as ImmutableMap,
  OrderedMap as ImmutableOrderedMap,
} from 'immutable';
import { WatchK8sResource } from '../../../../extensions/console-types';
import { getReduxData } from '../k8s-watcher';

describe('getReduxData', () => {
  it('should return null for falsy values', () => {
    const resource: WatchK8sResource = {};
    expect(getReduxData(null, resource)).toBe(null);
    expect(getReduxData(undefined, resource)).toBe(null);
  });

  it('should convert ImmutableList to pure JSON', () => {
    const immutableData = ImmutableList([
      ImmutableMap({ a: 1 }),
      ImmutableMap({ b: 2 }),
      ImmutableMap({ c: 3 }),
    ]);
    const resource: WatchK8sResource = { isList: true };
    expect(getReduxData(immutableData, resource)).toEqual([{ a: 1 }, { b: 2 }, { c: 3 }]);
  });

  it('should convert ImmutableStack to pure JSON', () => {
    const immutableData = ImmutableStack([
      ImmutableMap({ a: 1 }),
      ImmutableMap({ b: 2 }),
      ImmutableMap({ c: 3 }),
    ]);
    const resource: WatchK8sResource = { isList: true };
    expect(getReduxData(immutableData, resource)).toEqual([{ a: 1 }, { b: 2 }, { c: 3 }]);
  });

  it('should convert ImmutableSet to pure JSON', () => {
    const immutableData = ImmutableSet([
      ImmutableMap({ a: 1 }),
      ImmutableMap({ b: 2 }),
      ImmutableMap({ c: 3 }),
    ]);
    const resource: WatchK8sResource = { isList: true };
    expect(getReduxData(immutableData, resource)).toEqual([{ a: 1 }, { b: 2 }, { c: 3 }]);
  });

  it('should convert ImmutableOrderedSet to pure JSON', () => {
    const immutableData = ImmutableOrderedSet([
      ImmutableMap({ a: 1 }),
      ImmutableMap({ b: 2 }),
      ImmutableMap({ c: 3 }),
    ]);
    const resource: WatchK8sResource = { isList: true };
    expect(getReduxData(immutableData, resource)).toEqual([{ a: 1 }, { b: 2 }, { c: 3 }]);
  });

  it('should convert ImmutableMap to pure JSON', () => {
    const immutableData = ImmutableMap({ a: 1, b: 2, c: 3 });
    const resource: WatchK8sResource = {};
    expect(getReduxData(immutableData, resource)).toEqual({ a: 1, b: 2, c: 3 });
  });

  it('should convert ImmutableOrderedMap to pure JSON', () => {
    const immutableData = ImmutableOrderedMap({ a: 1, b: 2, c: 3 });
    const resource: WatchK8sResource = {};
    expect(getReduxData(immutableData, resource)).toEqual({ a: 1, b: 2, c: 3 });
  });

  it('should return the same JSON object for unchanged data', () => {
    const immutableData = ImmutableMap({ a: 1, b: 2, c: 3 });
    const resource: WatchK8sResource = {};
    const firstTime = getReduxData(immutableData, resource);
    const secondTime = getReduxData(immutableData, resource);
    expect(firstTime).toEqual({ a: 1, b: 2, c: 3 });
    expect(secondTime).toEqual({ a: 1, b: 2, c: 3 });
    expect(firstTime).toBe(secondTime);
  });

  it('should return a new JSON object if the data has changed', () => {
    const immutableData = ImmutableMap({ a: 1, b: 2, c: 3 });
    const changedData = immutableData.set('c', 4);
    const resource: WatchK8sResource = {};
    const firstTime = getReduxData(immutableData, resource);
    const secondTime = getReduxData(changedData, resource);
    expect(firstTime).toEqual({ a: 1, b: 2, c: 3 });
    expect(secondTime).toEqual({ a: 1, b: 2, c: 4 });
    expect(firstTime).not.toBe(secondTime);
  });

  it('should return the same JSON array and child objects for unchanged data ', () => {
    const immutableData = ImmutableList([
      ImmutableMap({ a: 1 }),
      ImmutableMap({ b: 2 }),
      ImmutableMap({ c: 3 }),
    ]);
    const resource: WatchK8sResource = { isList: true };
    const firstTime = getReduxData(immutableData, resource);
    const secondTime = getReduxData(immutableData, resource);
    expect(firstTime).toEqual([{ a: 1 }, { b: 2 }, { c: 3 }]);
    expect(secondTime).toEqual([{ a: 1 }, { b: 2 }, { c: 3 }]);
    // The array instance should be the same
    expect(firstTime).toBe(secondTime);
    expect(firstTime[0]).toBe(secondTime[0]);
    expect(firstTime[1]).toBe(secondTime[1]);
    expect(firstTime[2]).toBe(secondTime[2]);
  });

  it('should return the same JSON array and child objects for unchanged data ', () => {
    const immutableData = ImmutableList([
      ImmutableMap({ a: 1 }),
      ImmutableMap({ b: 2 }),
      ImmutableMap({ c: 3 }),
    ]);
    const changedData = immutableData.setIn([2, 'c'], 4);
    const resource: WatchK8sResource = { isList: true };
    const firstTime = getReduxData(immutableData, resource);
    const secondTime = getReduxData(changedData, resource);
    expect(firstTime).toEqual([{ a: 1 }, { b: 2 }, { c: 3 }]);
    expect(secondTime).toEqual([{ a: 1 }, { b: 2 }, { c: 4 }]);
    // The array should be changed
    expect(firstTime).not.toBe(secondTime);
    // But the included object data should return the same instance
    expect(firstTime[0]).toBe(secondTime[0]);
    expect(firstTime[1]).toBe(secondTime[1]);
    // Except for the changed object obviously
    expect(firstTime[2]).not.toBe(secondTime[2]);
  });

  it('should return different data for isList true and false, but same data when calling multiple times', () => {
    const immutableData = ImmutableMap({
      a: ImmutableMap({ a: 1 }),
      b: ImmutableMap({ b: 2 }),
      c: ImmutableMap({ c: 3 }),
    });
    const listFirstTime = getReduxData(immutableData, { isList: true });
    const noListFirstTime = getReduxData(immutableData, { isList: false });
    const listSecondTime = getReduxData(immutableData, { isList: true });
    const noListSecondTime = getReduxData(immutableData, { isList: false });

    // Contains the right data
    expect(listFirstTime).toEqual([{ a: 1 }, { b: 2 }, { c: 3 }]);
    expect(noListFirstTime).toEqual({ a: { a: 1 }, b: { b: 2 }, c: { c: 3 } });
    expect(listSecondTime).toEqual([{ a: 1 }, { b: 2 }, { c: 3 }]);
    expect(noListSecondTime).toEqual({ a: { a: 1 }, b: { b: 2 }, c: { c: 3 } });

    // Contains the same (cached) data for both calls
    expect(listFirstTime).toBe(listSecondTime);
    expect(noListFirstTime).toBe(noListSecondTime);
  });
});
