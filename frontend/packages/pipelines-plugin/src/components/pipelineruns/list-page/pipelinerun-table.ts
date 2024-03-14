import { Kebab } from '@console/internal/components/utils';

export const tableColumnClasses = {
  name: '',
  namespace: '',
  vulnerabilities: 'pf-m-hidden pf-m-visible-on-md',
  status: 'pf-m-hidden pf-m-visible-on-sm pf-v5-u-w-10-on-lg',
  taskStatus: 'pf-m-hidden pf-m-visible-on-lg',
  started: 'pf-m-hidden pf-m-visible-on-lg pf-v5-u-w-15-on-lg',
  duration: 'pf-m-hidden pf-m-visible-on-xl pf-v5-u-w-10-on-lg',
  actions: Kebab.columnClass,
};
