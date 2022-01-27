import * as React from 'react';
import { shallow } from 'enzyme';
import { useRoutesWatcher } from '@console/shared';
import { sampleDeployments } from '@console/shared/src/utils/__tests__/test-resource-data';
import { ROUTE_URL_ANNOTATION, ROUTE_DISABLED_ANNOTATION } from '../../../../../../const';
import { WorkloadModelProps } from '../../../../../../data-transforms/transform-utils';
import { OdcBaseNode } from '../../../../../../elements';
import Decorator from '../Decorator';
import UrlDecorator from '../UrlDecorator';

jest.mock('@console/shared', () => ({
  useRoutesWatcher: jest.fn(),
}));

const mockUseRoutesWatcher = useRoutesWatcher as jest.Mock;

const topologyNodeDataModel = {
  id: 'e187afa2-53b1-406d-a619-cf9ff1468031',
  type: 'workload',
  label: 'hello-openshift',
  resource: sampleDeployments.data[0],
  data: {
    data: {},
    id: 'e187afa2-53b1-406d-a619-cf9ff1468031',
    name: 'hello-openshift',
    type: 'workload',
    resources: {
      buildConfigs: [],
      obj: sampleDeployments.data[0],
      routes: [],
      services: [],
    },
  },
  ...WorkloadModelProps,
};

const routes = [
  {
    apiVersion: 'v1',
    kind: 'Route',
    metadata: {
      name: 'example',
    },
    spec: {
      host: 'www.example.com',
      tls: {
        termination: 'edge',
      },
      wildcardPolicy: 'None',
      to: {
        kind: 'Service',
        name: 'my-service',
        weight: 100,
      },
    },
    status: {
      ingress: [
        {
          host: 'www.example.com',
          conditions: [
            {
              type: 'Admitted',
              status: 'True',
              lastTransitionTime: '2018-04-30T16:55:48Z',
            },
          ],
        },
      ],
    },
  },
];

describe('URLDecorator', () => {
  let mockNode;
  beforeEach(() => {
    mockUseRoutesWatcher.mockReset();
    mockUseRoutesWatcher.mockReturnValue({ loaded: true, loadError: null, routes });
    mockNode = new OdcBaseNode();
  });

  it('should not show decorator if annotation ROUTE_DISABLED_ANNOTATION is true', () => {
    topologyNodeDataModel.resource.metadata.annotations[ROUTE_DISABLED_ANNOTATION] = 'true';
    mockNode.setModel(topologyNodeDataModel);
    const wrapper = shallow(<UrlDecorator element={mockNode} radius={10} x={0} y={0} />);
    expect(wrapper.find(Decorator).exists()).toBe(false);
    expect(mockUseRoutesWatcher).toHaveBeenCalledTimes(1);
    // Would be great to expect null here, but some internal help functions fail then.
    expect(mockUseRoutesWatcher).toHaveBeenCalledWith(sampleDeployments.data[0]);
  });

  it('should show decorator if annotation ROUTE_DISABLED_ANNOTATION is false', () => {
    topologyNodeDataModel.resource.metadata.annotations[ROUTE_DISABLED_ANNOTATION] = 'false';
    mockNode.setModel(topologyNodeDataModel);
    const wrapper = shallow(<UrlDecorator element={mockNode} radius={10} x={0} y={0} />);
    expect(wrapper.find(Decorator).exists()).toBe(true);
    expect(mockUseRoutesWatcher).toHaveBeenCalledTimes(1);
    expect(mockUseRoutesWatcher).toHaveBeenCalledWith(sampleDeployments.data[0]);
  });

  it('decorator href value should be equal to annotation ROUTE_URL_ANNOTATION', () => {
    const customURL = 'https://test.com';
    topologyNodeDataModel.resource.metadata.annotations[ROUTE_DISABLED_ANNOTATION] = 'false';
    topologyNodeDataModel.resource.metadata.annotations[ROUTE_URL_ANNOTATION] = customURL;
    mockNode.setModel(topologyNodeDataModel);
    const wrapper = shallow(<UrlDecorator element={mockNode} radius={10} x={0} y={0} />);
    expect(wrapper.find(Decorator).prop('href')).toBe(customURL);
    expect(mockUseRoutesWatcher).toHaveBeenCalledTimes(1);
    // Would be great to expect null here, but some internal help functions fail then.
    expect(mockUseRoutesWatcher).toHaveBeenCalledWith(sampleDeployments.data[0]);
  });

  it('decorator href value should be equal to default route if annotation ROUTE_URL_ANNOTATION is not present', () => {
    topologyNodeDataModel.resource.metadata.annotations[ROUTE_DISABLED_ANNOTATION] = 'false';
    topologyNodeDataModel.resource.metadata.annotations[ROUTE_URL_ANNOTATION] = '';
    mockNode.setModel(topologyNodeDataModel);
    const wrapper = shallow(<UrlDecorator element={mockNode} radius={10} x={0} y={0} />);
    expect(wrapper.find(Decorator).prop('href')).toBe('https://www.example.com');
    expect(mockUseRoutesWatcher).toHaveBeenCalledTimes(1);
    expect(mockUseRoutesWatcher).toHaveBeenCalledWith(sampleDeployments.data[0]);
  });

  it('decorator href value should not be shown if annotation ROUTE_URL_ANNOTATION contains javascript', () => {
    topologyNodeDataModel.resource.metadata.annotations[ROUTE_DISABLED_ANNOTATION] = 'false';
    topologyNodeDataModel.resource.metadata.annotations[ROUTE_URL_ANNOTATION] =
      // eslint-disable-next-line no-script-url
      'javascript:alert(1)';
    mockNode.setModel(topologyNodeDataModel);
    const wrapper = shallow(<UrlDecorator element={mockNode} radius={10} x={0} y={0} />);
    expect(wrapper.find(Decorator).exists()).toBe(false);
    expect(mockUseRoutesWatcher).toHaveBeenCalledTimes(1);
    // Would be great to expect null here, but some internal help functions fail then.
    expect(mockUseRoutesWatcher).toHaveBeenCalledWith(sampleDeployments.data[0]);
  });
});
