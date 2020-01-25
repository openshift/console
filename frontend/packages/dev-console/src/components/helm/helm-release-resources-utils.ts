import { K8sResourceKind } from '@console/internal/module/k8s';
import { TableFilter, TableFilterGroups } from '@console/internal/components/factory/table-filters';

export const helmReleaseResourceKindFilter: TableFilter = (
  filters: TableFilterGroups,
  resource: K8sResourceKind,
) => {
  if (!filters || !filters.selected || !filters.selected.size) {
    return true;
  }
  return filters.selected.has(resource.kind);
};

export const flattenResources = (resources: { [kind: string]: { data: K8sResourceKind[] } }) =>
  Object.keys(resources).reduce(
    (acc, kind) => [...acc, ...resources[kind].data.map((res) => ({ ...res, kind }))],
    [],
  );
