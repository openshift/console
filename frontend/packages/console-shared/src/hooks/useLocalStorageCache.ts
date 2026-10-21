import { useCallback } from 'react';
import * as _ from 'lodash';

const isFresh = ({ timestamp }: Timestamped, expiration: number): boolean =>
  expiration === undefined || !timestamp || Date.now() - timestamp <= expiration;

export const useLocalStorageCache = <T = any>(
  key: string,
  expiration?: number,
  comparator?: (a: T, b: T) => boolean,
): [Getter<T>, Setter<T>] => {
  const refreshCache = useCallback(() => {
    try {
      const serializedCache = window.localStorage.getItem(key);
      const records = serializedCache ? JSON.parse(serializedCache) : [];
      return records.filter((record: Timestamped<T>) => isFresh(record, expiration));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(`Error parsing cached records from local storage at key ${key}. Resetting.`);
      return [];
    }
  }, [expiration, key]);

  const recordExists = useCallback(
    (newRecord: T, records: T[]): boolean =>
      records.some((existingRecord) =>
        (comparator ?? _.isEqual)(
          { ...existingRecord, timestamp: 0 },
          { ...newRecord, timestamp: 0 },
        ),
      ),
    [comparator],
  );

  const getNewSerializedRecords = useCallback(
    (newRecord: T): [string, boolean] => {
      const currentRecords = refreshCache();
      if (recordExists(newRecord, currentRecords)) {
        return [JSON.stringify(currentRecords), false];
      }
      return [JSON.stringify([newRecord, ...currentRecords]), true];
    },
    [recordExists, refreshCache],
  );

  const addRecord = useCallback(
    (newRecord: T) => {
      const currentSerializedRecords = window.localStorage.getItem(key);
      const [updatedSerializedRecords, recordAdded] = getNewSerializedRecords({
        ...newRecord,
        timestamp: Date.now(),
      });
      if (updatedSerializedRecords !== currentSerializedRecords) {
        try {
          window.localStorage.setItem(key, updatedSerializedRecords);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn(`Error writing to local storage at key ${key}.`);
          return false;
        }
      }
      return recordAdded;
    },
    [getNewSerializedRecords, key],
  );

  const getRecords = useCallback((): T[] => refreshCache().map(({ timestamp, ...rest }) => rest), [
    refreshCache,
  ]);

  return [getRecords, addRecord];
};

type Getter<T> = () => T[];
type Setter<T> = (record: T) => boolean;
type Timestamped<T = {}> = T & { timestamp: number };
