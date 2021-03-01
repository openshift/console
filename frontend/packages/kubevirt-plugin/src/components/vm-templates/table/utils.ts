import * as classNames from 'classnames';

export const tableColumnClasses = (showNamespace: boolean) => [
  '', // name
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'), // provider
  classNames('pf-m-hidden', { 'pf-m-visible-on-lg': showNamespace }), // namespace
  classNames('pf-m-hidden', 'pf-m-visible-on-md'), // boot source
  classNames('pf-c-table__action', 'kubevirt-vm-template-actions'), // actions
];
