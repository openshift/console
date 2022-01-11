import classnames from 'classnames';
import { Kebab } from '@console/internal/components/utils';

export const tableColumnClasses = [
  '', // name
  '', // namespace
  classnames('pf-m-hidden', 'pf-m-visible-on-xl'), // ready
  classnames('pf-m-hidden', 'pf-m-visible-on-xl'), // condition
  classnames('pf-m-hidden', 'pf-m-visible-on-sm'), // filters
  '', // broker
  '', // subscriber
  classnames('pf-m-hidden', 'pf-m-visible-on-lg'), // created
  Kebab.columnClass, // kebab menu
];
