import { K8sKind } from '@console/internal/module/k8s';

export const InsightsModel: K8sKind = {
  kind: 'ReportOverview',
  label: 'report-overview',
  labelPlural: 'report-overviews',
  apiGroup: 'external-pipeline.redhat.com',
  apiVersion: 'v1',
  abbr: 'ro',
  namespaced: true,
  crd: true,
  plural: 'report-overviews',
};
