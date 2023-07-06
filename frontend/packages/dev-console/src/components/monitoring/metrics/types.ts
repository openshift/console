import { PrometheusLabels } from '@console/dynamic-plugin-sdk';

export type QueryObj = {
  disabledSeries?: PrometheusLabels[];
  isEnabled?: boolean;
  isExpanded?: boolean;
  query?: string;
  series?: PrometheusLabels[];
  text?: string;
};
