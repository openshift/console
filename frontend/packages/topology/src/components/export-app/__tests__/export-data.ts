import { K8sResourceKind } from '@console/internal/module/k8s';

export const mockExportData: K8sResourceKind = {
  apiVersion: 'primer.gitops.io/v1alpha1',
  kind: 'Export',
  metadata: {
    creationTimestamp: '2021-08-19T08:12:36Z',
    generation: 1,
    managedFields: [
      {
        apiVersion: 'primer.gitops.io/v1alpha1',
        fieldsType: 'FieldsV1',
        fieldsV1: {
          'f:spec': {
            '.': {},
            'f:method': {},
          },
        },
        manager: 'Mozilla',
        operation: 'Update',
        time: '2021-08-19T08:12:36Z',
      },
      {
        apiVersion: 'primer.gitops.io/v1alpha1',
        fieldsType: 'FieldsV1',
        fieldsV1: {
          'f:status': {
            '.': {},
            'f:completed': {},
            'f:route': {},
          },
        },
        manager: 'manager',
        operation: 'Update',
        subresource: 'status',
        time: '2021-08-19T08:14:14Z',
      },
    ],
    name: 'primer',
    namespace: 'jai-test',
    resourceVersion: '132256',
    uid: 'ec61b5d6-5904-4491-b02c-96873e6cdfdf',
  },
  spec: {
    method: 'download',
  },
  status: {
    completed: true,
    route:
      'https://primer-export-primer-jai-test.apps.jakumar-2021-08-18-144658.devcluster.openshift.com/ec61b5d6-5904-4491-b02c-96873e6cdfdf.zip',
  },
};
