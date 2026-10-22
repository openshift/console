import type { SortByDirection } from '@patternfly/react-table';
import * as _ from 'lodash';
import { sortResourceByValue } from '@console/internal/components/factory/Table/sort';

/**
 * Builds a `ConsoleDataViewColumn` sort function for columns whose sort value is derived from the
 * resource rather than read from a property path. Use this in place of a dot-delimited `sort`
 * string when the displayed value is computed, e.g. a PackageManifest's default channel.
 * @param valueGetter - Returns the value to sort a resource by.
 */
export const sortByValue =
  <D>(valueGetter: (obj: D) => string | number) =>
  (data: D[], direction: SortByDirection): D[] =>
    data.sort(sortResourceByValue<D>(direction, valueGetter));

/**
 * Sorts by a dot-delimited property path, collating a missing value as empty rather than as the
 * literal string "undefined". Prefer this over a plain `sort: 'some.path'` for any column whose
 * value is optional: `sortResourceByValue` stringifies the raw value, so `undefined` would
 * otherwise sort after every real entry instead of before them, which is where the legacy table
 * put it.
 * @param path - Dot-delimited path to the value, e.g. `status.phase`.
 */
export const sortByOptionalPath = <D>(path: string) =>
  sortByValue<D>((obj) => _.get(obj, path) ?? '');
