import { TableFilter } from '@console/internal/components/factory/table-filters';
import { K8sResourceKind } from '@console/internal/module/k8s';

export type FilterItem = {
  id: string;
  title: string;
};

export type Filter = {
  type: string;
  selected: string[];
  reducer(obj: K8sResourceKind): string;
  items: FilterItem[];
  filter: TableFilter;
};
