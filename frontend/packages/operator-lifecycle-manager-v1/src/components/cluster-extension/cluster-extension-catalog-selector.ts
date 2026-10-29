import { CATALOG_LABEL_KEY } from '../../const';
import type { ClusterExtensionKind } from '../../types';

type CatalogSelector = NonNullable<
  NonNullable<NonNullable<ClusterExtensionKind['spec']>['source']>['catalog']
>['selector'] & {
  matchExpressions?: { key: string; operator: string; values?: string[] }[];
};

export type CatalogSource = NonNullable<
  NonNullable<NonNullable<ClusterExtensionKind['spec']>['source']>['catalog']
> & {
  selector?: CatalogSelector;
};

export const catalogNames = (selector?: CatalogSelector): string[] => {
  const catalog = selector?.matchLabels?.[CATALOG_LABEL_KEY];
  if (catalog) return [catalog];

  return (
    selector?.matchExpressions?.find(
      ({ key, operator }) => key === CATALOG_LABEL_KEY && operator === 'In',
    )?.values ?? []
  );
};

export const selectorForCatalogs = (
  catalogs: string[],
  selector?: CatalogSelector,
): CatalogSelector | undefined => {
  const existingCatalogs = new Set(catalogNames(selector));
  const selectedCatalogs = new Set(catalogs);
  if (
    selectedCatalogs.size === existingCatalogs.size &&
    [...selectedCatalogs].every((catalog) => existingCatalogs.has(catalog))
  ) {
    return selector;
  }

  const conflictingExpressions = (selector?.matchExpressions ?? []).filter(
    ({ key, operator, values }) =>
      key === CATALOG_LABEL_KEY &&
      catalogs.length > 0 &&
      (operator === 'DoesNotExist' ||
        (operator === 'NotIn' && values?.some((value) => catalogs.includes(value)))),
  );

  const matchLabels = Object.fromEntries(
    Object.entries(selector?.matchLabels ?? {}).filter(([key]) => key !== CATALOG_LABEL_KEY),
  );
  const matchExpressions = (selector?.matchExpressions ?? []).filter(
    (expression) =>
      (expression.key !== CATALOG_LABEL_KEY || expression.operator !== 'In') &&
      !conflictingExpressions.includes(expression),
  );
  const updatedLabels =
    catalogs.length === 1 ? { ...matchLabels, [CATALOG_LABEL_KEY]: catalogs[0] } : matchLabels;
  const updatedExpressions =
    catalogs.length > 1
      ? [...matchExpressions, { key: CATALOG_LABEL_KEY, operator: 'In', values: catalogs }]
      : matchExpressions;

  return Object.keys(updatedLabels).length || updatedExpressions.length
    ? {
        ...(Object.keys(updatedLabels).length ? { matchLabels: updatedLabels } : {}),
        ...(updatedExpressions.length ? { matchExpressions: updatedExpressions } : {}),
      }
    : undefined;
};
