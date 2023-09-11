import { Kebab } from '@console/internal/components/utils';

export const tableColumnClasses = [
  'pf-v5-u-w-16-on-xl pf-v5-u-w-25-on-lg pf-v5-u-w-33-on-xs', // name
  'pf-v5-u-w-8-on-xl pf-v5-u-w-16-on-xs', // namespace
  'pf-v5-u-w-16-on-xl pf-v5-u-w-25-on-lg pf-v5-u-w-33-on-xs', // last run
  'pf-m-hidden pf-m-visible-on-lg', // task status
  'pf-m-hidden pf-m-visible-on-xl', // last run status
  'pf-m-hidden pf-m-visible-on-xl', // last run time
  Kebab.columnClass,
];
