import classNames from 'classnames';
import { Kebab } from '@console/internal/components/utils';

export const tableColumnClasses = [
  '', // name
  '', // namespace
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'), // ready
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'), // condition
  classNames('pf-m-hidden', 'pf-m-visible-on-sm'), // filters
  '', // broker
  '', // subscriber
  classNames('pf-m-hidden', 'pf-m-visible-on-lg'), // created
  Kebab.columnClass, // kebab menu
];
