import { referenceFor } from '@console/internal/module/k8s';
import { OdcBaseNode } from '../../elements';
import { TYPE_OPERATOR_BACKED_SERVICE } from '../../operators/components/const';
import { contextMenuActions } from '../contextMenuActions';

describe('context menu actions', () => {
  it('should return proper context data for Export operator backed service', () => {
    const mockOperatorBackedServiceNode = new OdcBaseNode();
    const OperatorBackedServiceModel = {
      id: 'mock-operator-backed-service-id',
      type: TYPE_OPERATOR_BACKED_SERVICE,
      label: '',
      resource: {
        kind: 'Export',
        apiVersion: 'primer.gitops.io/v1alpha1',
        metadata: {
          annotations: {
            'olm.operatorGroup': 'gitops-primer-system-mjlrj',
            'olm.operatorNamespace': 'gitops-primer-system',
          },
          labels: {
            'olm.copiedFrom': 'gitops-primer-system',
          },
          name: 'primer',
          namespace: 'test-ns',
          uid: 'edcfba4d-2e38-4337-b3fe-beb93b96145b',
        },
      },
      data: {
        resources: {},
        groupResources: [],
        data: {
          apiVersion: 'primer.gitops.io/v1alpha1',
          builderImage:
            'data:image/png;base64,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',
          csvName: 'gitops-primer.v0.0.1',
          operatorKind: 'Export',
        },
      },
    };
    mockOperatorBackedServiceNode.setModel(OperatorBackedServiceModel);
    const { csvName } = mockOperatorBackedServiceNode.getData()?.data;
    const resource = mockOperatorBackedServiceNode.getResource();
    const expectedContext = {
      'topology-actions': mockOperatorBackedServiceNode,
      [referenceFor(resource)]: resource,
      'csv-actions': {
        csvName,
        resource,
      },
    };
    expect(contextMenuActions(mockOperatorBackedServiceNode)[0].props.context).toEqual(
      expectedContext,
    );
  });
});
