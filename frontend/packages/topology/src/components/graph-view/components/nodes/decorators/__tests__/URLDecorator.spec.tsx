import type { ReactElement } from 'react';
import { SVGDefsProvider } from '@patternfly/react-topology';
import { render, screen } from '@testing-library/react';
import { useRoutesWatcher } from '@console/shared';
import { sampleDeployments } from '@console/shared/src/utils/__tests__/test-resource-data';
import { ROUTE_URL_ANNOTATION, ROUTE_DISABLED_ANNOTATION } from '../../../../../../const';
import { WorkloadModelProps } from '../../../../../../data-transforms/transform-utils';
import { OdcBaseNode } from '../../../../../../elements';
import UrlDecorator from '../UrlDecorator';

jest.mock('@console/shared', () => ({
  ...jest.requireActual('@console/shared'),
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

const renderInSvg = (element: ReactElement) => {
  return render(
    <svg>
      <SVGDefsProvider>{element}</SVGDefsProvider>
    </svg>,
  );
};

describe('URLDecorator', () => {
  let mockNode: OdcBaseNode;

  beforeEach(() => {
    mockUseRoutesWatcher.mockReset();
    mockUseRoutesWatcher.mockReturnValue({ loaded: true, loadError: null, routes });

    mockNode = new OdcBaseNode();
  });

  it('should not show decorator if ROUTE_DISABLED_ANNOTATION is true', () => {
    topologyNodeDataModel.resource.metadata.annotations[ROUTE_DISABLED_ANNOTATION] = 'true';
    mockNode.setModel(topologyNodeDataModel);

    renderInSvg(<UrlDecorator element={mockNode} radius={10} x={0} y={0} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(mockUseRoutesWatcher).toHaveBeenCalledWith(sampleDeployments.data[0]);
  });

  it('should show decorator if ROUTE_DISABLED_ANNOTATION is false', () => {
    topologyNodeDataModel.resource.metadata.annotations[ROUTE_DISABLED_ANNOTATION] = 'false';
    mockNode.setModel(topologyNodeDataModel);

    renderInSvg(<UrlDecorator element={mockNode} radius={10} x={0} y={0} />);

    const decorator = screen.getByRole('button');
    expect(decorator).toBeInTheDocument();
    expect(decorator).toHaveAttribute('href');
    expect(mockUseRoutesWatcher).toHaveBeenCalledWith(sampleDeployments.data[0]);
  });

  it('should use ROUTE_URL_ANNOTATION for href if present', () => {
    const customURL = 'https://test.com';
    topologyNodeDataModel.resource.metadata.annotations[ROUTE_DISABLED_ANNOTATION] = 'false';
    topologyNodeDataModel.resource.metadata.annotations[ROUTE_URL_ANNOTATION] = customURL;
    mockNode.setModel(topologyNodeDataModel);

    renderInSvg(<UrlDecorator element={mockNode} radius={10} x={0} y={0} />);

    const decorator = screen.getByRole('button');
    expect(decorator).toHaveAttribute('href', customURL);
    expect(mockUseRoutesWatcher).toHaveBeenCalledWith(sampleDeployments.data[0]);
  });

  it('should fall back to default route if ROUTE_URL_ANNOTATION is not set', () => {
    topologyNodeDataModel.resource.metadata.annotations[ROUTE_DISABLED_ANNOTATION] = 'false';
    topologyNodeDataModel.resource.metadata.annotations[ROUTE_URL_ANNOTATION] = '';
    mockNode.setModel(topologyNodeDataModel);

    renderInSvg(<UrlDecorator element={mockNode} radius={10} x={0} y={0} />);

    const decorator = screen.getByRole('button');
    expect(decorator).toHaveAttribute('href', 'https://www.example.com');
    expect(mockUseRoutesWatcher).toHaveBeenCalledWith(sampleDeployments.data[0]);
  });

  it('should not show decorator if ROUTE_URL_ANNOTATION contains javascript', () => {
    topologyNodeDataModel.resource.metadata.annotations[ROUTE_DISABLED_ANNOTATION] = 'false';
    topologyNodeDataModel.resource.metadata.annotations[ROUTE_URL_ANNOTATION] =
      'javascript:alert(1)'; // eslint-disable-line no-script-url
    mockNode.setModel(topologyNodeDataModel);

    renderInSvg(<UrlDecorator element={mockNode} radius={10} x={0} y={0} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(mockUseRoutesWatcher).toHaveBeenCalledWith(sampleDeployments.data[0]);
  });
});
