import type { MutableRefObject } from 'react';
import { act, render } from '@testing-library/react';
import { useLocalStorageCache } from '../useLocalStorageCache';

const mockGetItem = jest.fn();
const mockSetItem = jest.fn();

Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: mockGetItem,
    setItem: mockSetItem,
  },
  writable: true,
});

const now = Date.now();
jest.spyOn(Date, 'now').mockReturnValue(now);

const KEY = 'key';
const EXPIRATION = 1000;
const record = { foo: 'bar' };
const recordWithTimestamp = { ...record, timestamp: now };
const expiredRecord = { ...record, timestamp: now - EXPIRATION - 1 };

describe('useLocalStorageCache', () => {
  const hookRef: MutableRefObject<[() => any[], (r: any) => boolean]> = {
    current: undefined,
  };

  const TestComponent = ({
    cacheKey,
    expiration,
    comparator,
  }: {
    cacheKey: string;
    expiration?: number;
    comparator?: (a: any, b: any) => boolean;
  }) => {
    hookRef.current = useLocalStorageCache(cacheKey, expiration, comparator);
    return null;
  };

  afterEach(() => {
    mockGetItem.mockReset();
    mockSetItem.mockReset();
    hookRef.current = undefined;
  });

  it('should return empty array when cache is empty', () => {
    mockGetItem.mockReturnValue(null);
    render(<TestComponent cacheKey={KEY} />);
    const [getRecords] = hookRef.current;
    expect(getRecords()).toEqual([]);
  });

  it('should add a record to an empty cache', () => {
    mockGetItem.mockReturnValue(null);
    render(<TestComponent cacheKey={KEY} />);
    const [, addRecord] = hookRef.current;
    let added;
    act(() => {
      added = addRecord(record);
    });
    expect(mockSetItem).toHaveBeenCalledWith(KEY, JSON.stringify([recordWithTimestamp]));
    expect(added).toBe(true);
  });

  it('should not add a duplicate record', () => {
    mockGetItem.mockReturnValue(JSON.stringify([recordWithTimestamp]));
    render(<TestComponent cacheKey={KEY} />);
    const [, addRecord] = hookRef.current;
    let added;
    act(() => {
      added = addRecord(record);
    });
    expect(mockSetItem).not.toHaveBeenCalled();
    expect(added).toBe(false);
  });

  it('should return false when adding an existing record while another record expires', () => {
    const existingRecord = { foo: 'bar' };
    const expiredRecordInCache = { foo: 'baz', timestamp: now - EXPIRATION - 1 };
    const existingRecordInCache = { ...existingRecord, timestamp: now };

    mockGetItem.mockReturnValue(JSON.stringify([existingRecordInCache, expiredRecordInCache]));
    render(<TestComponent cacheKey={KEY} expiration={EXPIRATION} />);
    const [, addRecord] = hookRef.current;
    let added;
    act(() => {
      added = addRecord(existingRecord);
    });

    expect(mockSetItem).toHaveBeenCalledWith(KEY, JSON.stringify([existingRecordInCache]));
    expect(added).toBe(false);
  });

  it('should add a new record to an existing cache', () => {
    const existingRecord = { foo: 'baz' };
    mockGetItem.mockReturnValue(JSON.stringify([existingRecord]));
    render(<TestComponent cacheKey={KEY} />);
    const [, addRecord] = hookRef.current;
    let added;
    act(() => {
      added = addRecord(record);
    });
    expect(mockSetItem).toHaveBeenCalledWith(
      KEY,
      JSON.stringify([recordWithTimestamp, existingRecord]),
    );
    expect(added).toBe(true);
  });

  it('should not return expired records', () => {
    mockGetItem.mockReturnValue(JSON.stringify([expiredRecord, recordWithTimestamp]));
    render(<TestComponent cacheKey={KEY} expiration={EXPIRATION} />);
    const [getRecords] = hookRef.current;
    expect(getRecords()).toEqual([record]);
  });

  it('should use custom comparator', () => {
    const comparator = jest.fn((a, b) => a.foo === b.foo);
    mockGetItem.mockReturnValue(JSON.stringify([{ ...recordWithTimestamp, baz: 'qux' }]));
    render(<TestComponent cacheKey={KEY} expiration={EXPIRATION} comparator={comparator} />);
    const [, addRecord] = hookRef.current;
    let added;
    act(() => {
      added = addRecord({ ...record, baz: 'different' });
    });
    expect(comparator).toHaveBeenCalled();
    expect(mockSetItem).not.toHaveBeenCalled();
    expect(added).toBe(false);
  });
});
