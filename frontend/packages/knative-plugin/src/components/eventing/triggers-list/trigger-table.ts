import { css } from '@patternfly/react-styles';
import { Kebab } from '@console/internal/components/utils';

export const tableColumnClasses = [
  '', // name
  '', // namespace
  css('pf-m-hidden', 'pf-m-visible-on-xl'), // ready
  css('pf-m-hidden', 'pf-m-visible-on-xl'), // condition
  css('pf-m-hidden', 'pf-m-visible-on-sm'), // filters
  '', // broker
  '', // subscriber
  css('pf-m-hidden', 'pf-m-visible-on-lg'), // created
  Kebab.columnClass, // kebab menu
];
