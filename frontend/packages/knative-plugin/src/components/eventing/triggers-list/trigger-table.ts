import * as cx from 'classnames';
import { Kebab } from '@console/internal/components/utils';

export const tableColumnClasses = [
  '', // name
  '', // namespace
  cx('pf-m-hidden', 'pf-m-visible-on-xl'), // ready
  cx('pf-m-hidden', 'pf-m-visible-on-xl'), // condition
  cx('pf-m-hidden', 'pf-m-visible-on-sm'), // filters
  '', // broker
  '', // subscriber
  cx('pf-m-hidden', 'pf-m-visible-on-lg'), // created
  Kebab.columnClass, // kebab menu
];
