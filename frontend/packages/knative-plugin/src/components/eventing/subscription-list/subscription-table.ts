import { css } from '@patternfly/react-styles';
import { Kebab } from '@console/internal/components/utils';

export const tableColumnClasses = [
  '', // name
  '', // namespace
  css('pf-m-hidden', 'pf-m-visible-on-sm'), // ready
  css('pf-m-hidden', 'pf-m-visible-on-md'), // condition
  css('pf-m-hidden', 'pf-m-visible-on-xl'), // channel
  css('pf-m-hidden', 'pf-m-visible-on-xl'), // subscriber
  css('pf-m-hidden', 'pf-m-visible-on-2xl'), // created
  Kebab.columnClass, // kebab menu
];
