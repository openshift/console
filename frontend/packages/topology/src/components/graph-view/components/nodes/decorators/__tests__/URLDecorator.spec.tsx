import * as React from 'react';
import { shallow } from 'enzyme';
import { sampleDeployments } from '@console/shared/src/utils/__tests__/test-resource-data';
import { ROUTE_URL_ANNOTATION, ROUTE_DISABLED_ANNOTATION } from '../../../../../../const';
import { WorkloadModelProps } from '../../../../../../data-transforms/transform-utils';
import { useRoutesURL } from '../../../../../../data-transforms/useRoutesURL';
import { OdcBaseNode } from '../../../../../../elements';
import Decorator from '../Decorator';
import UrlDecorator from '../UrlDecorator';

jest.mock('../../../../../../data-transforms/useRoutesURL', () => ({
  useRoutesURL: jest.fn(),
}));

const mockUseRoutesURL = useRoutesURL as jest.Mock;

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

describe('URLDecorator', () => {
  let mockNode;
  beforeEach(() => {
    mockUseRoutesURL.mockReturnValue('https://example.com');
    mockNode = new OdcBaseNode();
  });

  it('should not show decorator if annotation ROUTE_DISABLED_ANNOTATION is true', () => {
    topologyNodeDataModel.resource.metadata.annotations[ROUTE_DISABLED_ANNOTATION] = 'true';
    mockNode.setModel(topologyNodeDataModel);
    const wrapper = shallow(<UrlDecorator element={mockNode} radius={10} x={0} y={0} />);
    expect(wrapper.find(Decorator).exists()).toBe(false);
  });

  it('should show decorator if annotation ROUTE_DISABLED_ANNOTATION is false', () => {
    topologyNodeDataModel.resource.metadata.annotations[ROUTE_DISABLED_ANNOTATION] = 'false';
    mockNode.setModel(topologyNodeDataModel);
    const wrapper = shallow(<UrlDecorator element={mockNode} radius={10} x={0} y={0} />);
    expect(wrapper.find(Decorator).exists()).toBe(true);
  });

  it('decorator href value should be equal to annotation ROUTE_URL_ANNOTATION', () => {
    const customURL = 'https://test.com';
    topologyNodeDataModel.resource.metadata.annotations[ROUTE_DISABLED_ANNOTATION] = 'false';
    topologyNodeDataModel.resource.metadata.annotations[ROUTE_URL_ANNOTATION] = customURL;
    mockNode.setModel(topologyNodeDataModel);
    const wrapper = shallow(<UrlDecorator element={mockNode} radius={10} x={0} y={0} />);
    expect(wrapper.find(Decorator).prop('href')).toBe(customURL);
  });

  it('decorator href value should be equal to default route if annotation ROUTE_URL_ANNOTATION is not present', () => {
    topologyNodeDataModel.resource.metadata.annotations[ROUTE_DISABLED_ANNOTATION] = 'false';
    topologyNodeDataModel.resource.metadata.annotations[ROUTE_URL_ANNOTATION] = '';
    mockNode.setModel(topologyNodeDataModel);
    const wrapper = shallow(<UrlDecorator element={mockNode} radius={10} x={0} y={0} />);
    expect(wrapper.find(Decorator).prop('href')).toBe('https://example.com');
  });
});
