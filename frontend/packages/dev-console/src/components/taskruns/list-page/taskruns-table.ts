import { Kebab } from '@console/internal/components/utils';

export const tableColumnClasses = [
  '', // name
  '', // namespace
  '', // pipeline
  'pf-m-hidden pf-m-visible-on-sm', // task
  'pf-m-hidden pf-m-visible-on-sm', // pod
  'pf-m-hidden pf-m-visible-on-sm', // status
  'pf-m-hidden pf-m-visible-on-sm', // started
  Kebab.columnClass,
];
