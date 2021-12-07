import classnames from 'classnames';
import { Kebab } from '@console/internal/components/utils';

export const tableColumnClasses = [
  '', // name
  '', // namespace
  classnames('pf-m-hidden', 'pf-m-visible-on-sm'), // url
  classnames('pf-m-hidden', 'pf-m-visible-on-lg'), // generation
  classnames('pf-m-hidden', 'pf-m-visible-on-lg'), // created
  classnames('pf-m-hidden', 'pf-m-visible-on-xl'), // conditions
  classnames('pf-m-hidden', 'pf-m-visible-on-xl'), // ready
  classnames('pf-m-hidden', 'pf-m-visible-on-2xl'), // created
  Kebab.columnClass,
];
