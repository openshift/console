import classNames from 'classnames';
import { Kebab } from '@console/internal/components/utils';

export const tableColumnClasses = [
  '', // name
  '', // namespace
  classNames('pf-m-hidden', 'pf-m-visible-on-sm'), // ready
  classNames('pf-m-hidden', 'pf-m-visible-on-md'), // condition
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'), // channel
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'), // subscriber
  classNames('pf-m-hidden', 'pf-m-visible-on-2xl'), // created
  Kebab.columnClass, // kebab menu
];
