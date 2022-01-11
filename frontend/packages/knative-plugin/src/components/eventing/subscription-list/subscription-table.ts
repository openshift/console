import classnames from 'classnames';
import { Kebab } from '@console/internal/components/utils';

export const tableColumnClasses = [
  '', // name
  '', // namespace
  classnames('pf-m-hidden', 'pf-m-visible-on-sm'), // ready
  classnames('pf-m-hidden', 'pf-m-visible-on-md'), // condition
  classnames('pf-m-hidden', 'pf-m-visible-on-xl'), // channel
  classnames('pf-m-hidden', 'pf-m-visible-on-xl'), // subscriber
  classnames('pf-m-hidden', 'pf-m-visible-on-2xl'), // created
  Kebab.columnClass, // kebab menu
];
