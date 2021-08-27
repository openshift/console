import { Kebab } from '@console/internal/components/utils';

export const tableColumnClasses = [
  '', // name
  '', // namespace
  'pf-m-hidden pf-m-visible-on-sm', // url
  'pf-m-hidden pf-m-visible-on-lg', // created
  'pf-m-hidden pf-m-visible-on-xl', // conditions
  'pf-m-hidden pf-m-visible-on-2xl', // traffic
  Kebab.columnClass,
];
