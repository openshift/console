import { OdcBaseNode } from '@console/topology/src/elements';
import { OdcNodeModel } from '@console/topology/src/topology-types';
import {
  kameletBindingSinkRes,
  knSinkDeployment,
} from '../../__tests__/__mocks__/knativeResourcesData';
import { knativeServiceObj } from '../../__tests__/topology-knative-test-data';
import { TYPE_EVENT_SOURCE } from '../../const';
import { KameletType } from '../../topology-types';
import { useKnativeSidepanelSinkAssociatedDeployment } from '../knative-eventsource-tab-sections';

describe('useKnativeSidepanelSinkAssociatedDeployment', () => {
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

  it('should render nothing if the resource is null', () => {
    const result = useKnativeSidepanelSinkAssociatedDeployment(mockKnNode);
    expect(result).toEqual([undefined, true, undefined]);
  });

  it('should render nothing if the resource type is not dynamic Event-source or Kamelet Binding or Kamelet Source', () => {
    knModel.resource = knativeServiceObj;
    knModel.data.resources.associatedDeployment = knSinkDeployment;
    mockKnNode.setModel(knModel);
    const result = useKnativeSidepanelSinkAssociatedDeployment(mockKnNode);
    expect(result).toEqual([undefined, true, undefined]);
  });

  it('should render the associated deployments if the resource type is Kamelet Binding of type Source', () => {
    knModel.resource = kameletBindingSinkRes;
    knModel.data.resources.associatedDeployment = knSinkDeployment;
    knModel.data.data.kameletType = KameletType.Source;
    mockKnNode.setModel(knModel);
    const result = useKnativeSidepanelSinkAssociatedDeployment(mockKnNode);
    expect(result).toEqual([expect.any(Object), true, undefined]);
    const topologySideBarTabSection = result[0];
    const eventSourceDeployments = topologySideBarTabSection.props.children;
    expect(eventSourceDeployments.props['data-test']).toEqual('event-source-deployments');
  });
});
