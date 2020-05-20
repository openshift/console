import * as classNames from 'classnames';

import { Kebab } from '@console/internal/components/utils';

export const tableColumnClasses = [
  '', // name
  '', // namespace
  classNames('pf-m-hidden', 'pf-m-visible-on-sm'), // url
  classNames('pf-m-hidden', 'pf-m-visible-on-lg'), // generation
  classNames('pf-m-hidden', 'pf-m-visible-on-lg'), // created
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'), // conditions
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'), // ready
  classNames('pf-m-hidden', 'pf-m-visible-on-2xl'), // created
  Kebab.columnClass,
];
