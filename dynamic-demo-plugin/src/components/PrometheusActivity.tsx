import { PrometheusActivityProps } from '@openshift-console/dynamic-plugin-sdk';

export const isDemoPrometheusActivity = () => true;

export const DemoPrometheusActivity: React.FC<PrometheusActivityProps> = () => (
  <div>Demo prometheus activity</div>
);
