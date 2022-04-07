import { OdcBaseNode } from '@console/topology/src/elements';
import { OdcNodeModel } from '@console/topology/src/topology-types';
import {
  kameletBindingSinkRes,
  knSinkDeployment,
} from '../../__tests__/__mocks__/knativeResourcesData';
import { knativeServiceObj } from '../../__tests__/topology-knative-test-data';
import { TYPE_EVENT_SOURCE } from '../../const';
import { KameletType } from '../../topology-types';
import { getKnativeSidepanelSinkAssociatedDeployment } from '../knative-eventsource-tab-sections';

describe('getKnativeSidepanelSinkAssociatedDeployment', () => {
  const mockKnNode = new OdcBaseNode();
  let knModel: OdcNodeModel;
  beforeEach(() => {
    knModel = {
      id: 'mock-operator-backed-service-id',
      type: TYPE_EVENT_SOURCE,
      label: '',
      resource: null,
      data: {
        resources: {},
        groupResources: [],
        data: {},
      },
    };
    mockKnNode.setModel(knModel);
  });

  it('should return null if the resource is null', () => {
    const result = getKnativeSidepanelSinkAssociatedDeployment(mockKnNode);
    expect(result).toEqual(null);
  });

  it('should return undefined if the resource type is not dynamic Event-source or Kamelet Binding or Kamelet Source', () => {
    knModel.resource = knativeServiceObj;
    knModel.data.resources.associatedDeployment = knSinkDeployment;
    mockKnNode.setModel(knModel);
    const result = getKnativeSidepanelSinkAssociatedDeployment(mockKnNode);
    expect(result).toEqual(undefined);
  });

  it('should render the associated deployments if the resource type is Kamelet Binding of type Source', () => {
    knModel.resource = kameletBindingSinkRes;
    knModel.data.resources.associatedDeployment = knSinkDeployment;
    knModel.data.data.kameletType = KameletType.Source;
    mockKnNode.setModel(knModel);
    const result = getKnativeSidepanelSinkAssociatedDeployment(mockKnNode);
    expect(result.props.children.props['data-test']).toEqual('event-source-deployments');
  });
});
