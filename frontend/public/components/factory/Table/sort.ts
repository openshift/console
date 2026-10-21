import { SortByDirection } from '@patternfly/react-table';

import { K8sResourceCommon } from '../../../module/k8s';

const isNumber = (value): value is number => Number.isFinite(value);

export const sortResourceByValue = <D = any, V = any>(
  sortDirection: SortByDirection,
  valueGetter: (obj: D) => V,
) => (a: D, b: D): number => {
  const lang = navigator.languages[0] || navigator.language;
  // Use `localCompare` with `numeric: true` for a natural sort order (e.g., pv-1, pv-9, pv-10)
  const compareOpts = { numeric: true, ignorePunctuation: true };
  const aValue = valueGetter(a);
  const bValue = valueGetter(b);
  const result: number =
    isNumber(aValue) && isNumber(bValue)
      ? aValue - bValue
      : `${aValue}`.localeCompare(`${bValue}`, lang, compareOpts);
  if (result !== 0) {
    return sortDirection === SortByDirection.asc ? result : result * -1;
  }

  // Use name as a secondary sort for a stable sort.
  const aName = (a as K8sResourceCommon)?.metadata?.name || '';
  const bName = (b as K8sResourceCommon)?.metadata?.name || '';
  return aName.localeCompare(bName, lang, compareOpts);
};
