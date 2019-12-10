import { Kebab } from '@console/internal/components/utils';

export const tableColumnClasses = [
  '', // name
  '', // namespace
  'pf-m-hidden pf-m-visible-on-sm', // status
  'pf-m-hidden pf-m-visible-on-lg', // task status
  'pf-m-hidden pf-m-visible-on-lg', // started
  'pf-m-hidden pf-m-visible-on-xl', // duration
  Kebab.columnClass,
];
