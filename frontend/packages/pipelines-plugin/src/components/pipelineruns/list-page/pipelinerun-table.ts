import { Kebab } from '@console/internal/components/utils';

export const tableColumnClasses = {
  name: '',
  namespace: '',
  vulnerabilities: 'pf-m-hidden pf-m-visible-on-md',
  status: 'pf-m-hidden pf-m-visible-on-sm',
  taskStatus: 'pf-m-hidden pf-m-visible-on-lg',
  started: 'pf-m-hidden pf-m-visible-on-lg',
  duration: 'pf-m-hidden pf-m-visible-on-xl',
  actions: Kebab.columnClass,
};
