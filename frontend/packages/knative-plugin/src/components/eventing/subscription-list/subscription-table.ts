import * as cx from 'classnames';
import { Kebab } from '@console/internal/components/utils';

export const tableColumnClasses = [
  '', // name
  '', // namespace
  cx('pf-m-hidden', 'pf-m-visible-on-sm'), // ready
  cx('pf-m-hidden', 'pf-m-visible-on-md'), // condition
  cx('pf-m-hidden', 'pf-m-visible-on-xl'), // channel
  cx('pf-m-hidden', 'pf-m-visible-on-xl'), // subscriber
  cx('pf-m-hidden', 'pf-m-visible-on-2xl'), // created
  Kebab.columnClass, // kebab menu
];
