import { KEBAB_COLUMN_CLASS } from '@console/shared/src/components/actions/LazyActionMenu';

export const tableColumnClasses = [
  '', // name
  '', // namespace
  'pf-m-hidden pf-m-visible-on-sm', // service
  'pf-m-hidden pf-m-visible-on-lg', // created
  'pf-m-hidden pf-m-visible-on-xl', // conditions
  'pf-m-hidden pf-m-visible-on-xl', // ready
  'pf-m-hidden pf-m-visible-on-2xl', // reason
  KEBAB_COLUMN_CLASS,
];
