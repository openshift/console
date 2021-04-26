import * as classNames from 'classnames';
import { Kebab } from '@console/internal/components/utils';

export const tableColumnClasses = (showNamespace: boolean) => [
  classNames('pf-c-table__action', Kebab.columnClass),
  '', // name
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'), // provider
  classNames('pf-m-hidden', { 'pf-m-visible-on-lg': showNamespace }), // namespace
  classNames('pf-m-hidden', 'pf-m-visible-on-md'), // boot source
  classNames('pf-m-hidden', 'pf-m-visible-on-md', 'kubevirt-vm-template-actions'), // detauls button
  classNames('pf-c-table__action', Kebab.columnClass), // actions
];
