import { useCallback, useMemo } from 'react';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk/src/api/useResolvedExtensions';
import type { K8sResourceCommon } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type {
  DetailsItem,
  DetailsItemColumn,
} from '@console/dynamic-plugin-sdk/src/extensions/details-item';
import { isDetailsItem } from '@console/dynamic-plugin-sdk/src/extensions/details-item';
import type { ResolvedExtension, ExtensionTypeGuard } from '@console/dynamic-plugin-sdk/src/types';
import { referenceFor, referenceForExtensionModel } from '@console/internal/module/k8s/k8s';

/**
 * A hook to retrieve sorted details item extensions for a given resource and column.
 *
 * @param obj The k8s resource for which details are being rendered.
 * @param column The column in which the details item will be rendered.
 * @returns A sorted list of details item extensions for the given resource and column. Null safe.
 */
export const useDetailsItemExtensionsForResource: UseDetailsItemExtensionsForResource = (
  obj,
  column,
) => {
  const typeGuard = useCallback<ExtensionTypeGuard<DetailsItem>>(
    (e): e is DetailsItem => {
      if (!isDetailsItem(e)) return false;
      const columnMatches = e.properties.column === column;
      const modelMatches = referenceFor(obj) === referenceForExtensionModel(e.properties.model);
      return modelMatches && columnMatches;
    },
    [obj, column],
  );

  const [extensions] = useResolvedExtensions<DetailsItem>(typeGuard);

  return useMemo(
    () =>
      (extensions ?? []).sort((a, b) => {
        const aWeight = Number(a.properties.sortWeight);
        const bWeight = Number(b.properties.sortWeight);
        if (Number.isNaN(aWeight)) {
          return 1;
        }
        if (Number.isNaN(bWeight)) {
          return -1;
        }
        return aWeight - bWeight;
      }),
    [extensions],
  );
};

type UseDetailsItemExtensionsForResource = (
  obj: K8sResourceCommon,
  column: DetailsItemColumn,
) => ResolvedExtension<DetailsItem>[];
