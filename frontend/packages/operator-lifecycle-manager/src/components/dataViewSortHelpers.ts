import type { SortByDirection } from '@patternfly/react-table';
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
