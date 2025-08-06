import { css } from '@patternfly/react-styles';
import { Kebab } from '@console/internal/components/utils';

export const tableColumnClasses = [
  '', // name
  '', // namespace
  css('pf-m-hidden', 'pf-m-visible-on-sm'), // url
  css('pf-m-hidden', 'pf-m-visible-on-xl'), // conditions
  css('pf-m-hidden', 'pf-m-visible-on-xl'), // ready
  css('pf-m-hidden', 'pf-m-visible-on-2xl'), // reason
  css('pf-m-hidden', 'pf-m-visible-on-lg'), // revision
  css('pf-m-hidden', 'pf-m-visible-on-lg'), // created
  Kebab.columnClass,
];
