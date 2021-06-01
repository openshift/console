import { Kebab } from '@console/internal/components/utils';

export const tableColumnClasses = [
  'pf-u-w-16-on-xl pf-u-w-25-on-lg pf-u-w-33-on-xs', // name
  'pf-u-w-8-on-xl pf-u-w-16-on-xs', // namespace
  'pf-u-w-16-on-xl pf-u-w-25-on-lg pf-u-w-33-on-xs', // last run
  'pf-m-hidden pf-m-visible-on-lg', // task status
  'pf-m-hidden pf-m-visible-on-xl', // last run status
  'pf-m-hidden pf-m-visible-on-xl', // last run time
  Kebab.columnClass,
];
