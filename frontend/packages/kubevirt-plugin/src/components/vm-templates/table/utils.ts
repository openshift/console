import classnames from 'classnames';
import { Kebab } from '@console/internal/components/utils';

export const tableColumnClasses = (showNamespace: boolean) => [
  classnames('pf-c-table__action', Kebab.columnClass),
  '', // name
  classnames('pf-m-hidden', 'pf-m-visible-on-xl'), // provider
  classnames('pf-m-hidden', 'pf-m-visible-on-xl'), // support level
  classnames('pf-m-hidden', { 'pf-m-visible-on-lg': showNamespace }), // namespace
  classnames('pf-m-hidden', 'pf-m-visible-on-md'), // boot source
  classnames('pf-m-hidden', 'pf-m-visible-on-md', 'kubevirt-vm-template-actions'), // details button
  classnames('pf-c-table__action', Kebab.columnClass), // actions
];
