import {
  List as ImmutableList,
  Stack as ImmutableStack,
  Set as ImmutableSet,
  OrderedSet as ImmutableOrderedSet,
  Map as ImmutableMap,
  OrderedMap as ImmutableOrderedMap,
} from 'immutable';
import { WatchK8sResource } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { getReduxData } from '../k8s-watch-hook';

describe('getReduxData', () => {
  it('should return null for falsy values', () => {
    const resource: WatchK8sResource = { kind: 'Pod' };
    expect(getReduxData(null, resource)).toBe(null);
    expect(getReduxData(undefined, resource)).toBe(null);
  });

  it('should convert ImmutableList to pure JSON', () => {
    const immutableData = ImmutableList([
      ImmutableMap({ a: 1 }),
      ImmutableMap({ b: 2 }),
      ImmutableMap({ c: 3 }),
    ]);
    const resource: WatchK8sResource = { kind: 'Pod', isList: true };
    expect(getReduxData(immutableData, resource)).toEqual([{ a: 1 }, { b: 2 }, { c: 3 }]);
  });

  it('should convert ImmutableStack to pure JSON', () => {
    const immutableData = ImmutableStack([
      ImmutableMap({ a: 1 }),
      ImmutableMap({ b: 2 }),
      ImmutableMap({ c: 3 }),
    ]);
    const resource: WatchK8sResource = { kind: 'Pod', isList: true };
    expect(getReduxData(immutableData, resource)).toEqual([{ a: 1 }, { b: 2 }, { c: 3 }]);
  });

  it('should convert ImmutableSet to pure JSON', () => {
    const immutableData = ImmutableSet([
      ImmutableMap({ a: 1 }),
      ImmutableMap({ b: 2 }),
      ImmutableMap({ c: 3 }),
    ]);
    const resource: WatchK8sResource = { kind: 'Pod', isList: true };
    expect(getReduxData(immutableData, resource)).toEqual([{ a: 1 }, { b: 2 }, { c: 3 }]);
  });

  it('should convert ImmutableOrderedSet to pure JSON', () => {
    const immutableData = ImmutableOrderedSet([
      ImmutableMap({ a: 1 }),
      ImmutableMap({ b: 2 }),
      ImmutableMap({ c: 3 }),
    ]);
    const resource: WatchK8sResource = { kind: 'Pod', isList: true };
    expect(getReduxData(immutableData, resource)).toEqual([{ a: 1 }, { b: 2 }, { c: 3 }]);
  });

  it('should convert ImmutableMap to pure JSON', () => {
    const immutableData = ImmutableMap({ a: 1, b: 2, c: 3 });
    const resource: WatchK8sResource = { kind: 'Pod' };
    expect(getReduxData(immutableData, resource)).toEqual({ a: 1, b: 2, c: 3 });
  });

  it('should convert ImmutableOrderedMap to pure JSON', () => {
    const immutableData = ImmutableOrderedMap({ a: 1, b: 2, c: 3 });
    const resource: WatchK8sResource = { kind: 'Pod' };
    expect(getReduxData(immutableData, resource)).toEqual({ a: 1, b: 2, c: 3 });
  });

  it('should return the same JSON object for unchanged data', () => {
    const immutableData = ImmutableMap({ a: 1, b: 2, c: 3 });
    const resource: WatchK8sResource = { kind: 'Pod' };
    const firstTime = getReduxData(immutableData, resource);
    const secondTime = getReduxData(immutableData, resource);
    expect(firstTime).toEqual({ a: 1, b: 2, c: 3 });
    expect(secondTime).toEqual({ a: 1, b: 2, c: 3 });
    expect(firstTime).toBe(secondTime);
  });

  it('should return a new JSON object if the data has changed', () => {
    const immutableData = ImmutableMap({ a: 1, b: 2, c: 3 });
    const changedData = immutableData.set('c', 4);
    const resource: WatchK8sResource = { kind: 'Pod' };
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
    const resource: WatchK8sResource = { kind: 'Pod', isList: true };
    const firstTime = getReduxData(immutableData, resource);
    const secondTime = getReduxData(immutableData, resource);
    expect(firstTime).toEqual([{ a: 1 }, { b: 2 }, { c: 3 }]);
    expect(secondTime).toEqual([{ a: 1 }, { b: 2 }, { c: 3 }]);
    // The array instance should be the same
    expect(firstTime).not.toBe(secondTime); // TODO???
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
    const resource: WatchK8sResource = { kind: 'Pod', isList: true };
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
});
