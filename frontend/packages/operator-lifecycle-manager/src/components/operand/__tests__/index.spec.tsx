import { screen } from '@testing-library/react';
import * as _ from 'lodash';
import * as ReactRouter from 'react-router-dom-v5-compat';
import { DetailsPage } from '@console/internal/components/factory';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { testResourceInstance, testClusterServiceVersion } from '../../../../mocks';
import { ClusterServiceVersionModel } from '../../../models';
import {
  OperandTableRow,
  OperandDetailsPage,
  ProvidedAPIsPage,
  ProvidedAPIPage,
  OperandStatus,
} from '../index';

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useParams: jest.fn(),
  useLocation: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useK8sModels', () => ({
  useK8sModels: () => [
    {
      'testapp.coreos.com~v1alpha1~TestResource': {
        abbr: 'TR',
        apiGroup: 'testapp.coreos.com',
        apiVersion: 'v1alpha1',
        crd: true,
        kind: 'TestResource',
        label: 'Test Resource',
        labelPlural: 'Test Resources',
        namespaced: true,
        plural: 'testresources',
        verbs: ['create'],
      },
    },
    false,
    null,
  ],
}));

jest.mock('@console/shared/src/hooks/useK8sModel', () => ({
  useK8sModel: () => [
    {
      abbr: 'TR',
      apiGroup: 'testapp.coreos.com',
      apiVersion: 'v1alpha1',
      crd: true,
      kind: 'TestResource',
      label: 'Test Resource',
      labelPlural: 'Test Resources',
      namespaced: true,
      plural: 'testresources',
      verbs: ['create'],
    },
    false,
    null,
  ],
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => jest.fn(),
}));

jest.mock('@console/internal/components/factory', () => ({
  ...jest.requireActual('@console/internal/components/factory'),
  DetailsPage: jest.fn(() => null),
}));

const mockDetailsPage = DetailsPage as jest.Mock;

describe('OperandTableRow', () => {
  it('renders operand name and namespace when provided', () => {
    renderWithProviders(
      <table>
        <tbody>
          <tr>
            <OperandTableRow obj={testResourceInstance} columns={[]} showNamespace />
          </tr>
        </tbody>
      </table>,
    );

    expect(screen.getByText(testResourceInstance.metadata.name)).toBeInTheDocument();
    expect(screen.getByText(testResourceInstance.metadata.namespace)).toBeInTheDocument();
  });

  it('renders operand kind', () => {
    renderWithProviders(
      <table>
        <tbody>
          <tr>
            <OperandTableRow obj={testResourceInstance} columns={[]} showNamespace />
          </tr>
        </tbody>
      </table>,
    );

    expect(screen.getByText(testResourceInstance.kind)).toBeInTheDocument();
  });
});

describe('OperandStatus', () => {
  it('displays status when status field is present', () => {
    const operand = {
      status: {
        status: 'Running',
        state: 'Degraded',
        conditions: [
          {
            type: 'Failed',
            status: 'True',
          },
        ],
      },
    };

    renderWithProviders(<OperandStatus operand={operand} />);

    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByTestId('status-text')).toHaveTextContent('Running');
  });

  it('displays phase when phase field is present', () => {
    const operand = {
      status: {
        phase: 'Running',
        status: 'Installed',
        state: 'Degraded',
        conditions: [
          {
            type: 'Failed',
            status: 'True',
          },
        ],
      },
    };

    renderWithProviders(<OperandStatus operand={operand} />);

    expect(screen.getByText('Phase')).toBeInTheDocument();
    expect(screen.getByTestId('status-text')).toHaveTextContent('Running');
  });

  it('displays state when only state field is present', () => {
    const operand = {
      status: {
        state: 'Running',
        conditions: [
          {
            type: 'Failed',
            status: 'True',
          },
        ],
      },
    };

    renderWithProviders(<OperandStatus operand={operand} />);

    expect(screen.getByText('State')).toBeInTheDocument();
    expect(screen.getByTestId('status-text')).toHaveTextContent('Running');
  });

  it('displays condition type when condition status is True', () => {
    const operand = {
      status: {
        conditions: [
          {
            type: 'Failed',
            status: 'False',
          },
          {
            type: 'Running',
            status: 'True',
          },
        ],
      },
    };

    renderWithProviders(<OperandStatus operand={operand} />);

    expect(screen.getByText('Condition')).toBeInTheDocument();
    expect(screen.getByTestId('status-text')).toHaveTextContent('Running');
  });

  it('displays dash when no status information is available', () => {
    const operand = {};

    renderWithProviders(<OperandStatus operand={operand} />);

    expect(screen.getByText('-')).toBeInTheDocument();
  });
});

describe('OperandDetailsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(ReactRouter, 'useParams').mockReturnValue({
      ns: 'default',
      appName: 'testapp',
      plural: 'testapp.coreos.com~v1alpha1~TestResource',
      name: 'my-test-resource',
    });

    jest.spyOn(ReactRouter, 'useLocation').mockReturnValue({
      pathname: `/k8s/ns/default/${ClusterServiceVersionModel.plural}/testapp/testapp.coreos.com~v1alpha1~TestResource/my-test-resource`,
      search: '',
      state: null,
      hash: '',
      key: 'default',
    });
  });

  it('renders without errors', () => {
    expect(() => {
      renderWithProviders(<OperandDetailsPage />);
    }).not.toThrow();
  });

  it('configures DetailsPage with Details, YAML, Resources, and Events tabs', () => {
    renderWithProviders(<OperandDetailsPage />);

    // One call for initial render and another for when pluginStore is initialized
    expect(mockDetailsPage).toHaveBeenCalledTimes(2);
    const [detailsPageProps] = mockDetailsPage.mock.calls[0];

    expect(detailsPageProps.pages).toHaveLength(4);
    expect(detailsPageProps.pages[0].nameKey).toEqual('public~Details');
    expect(detailsPageProps.pages[1].nameKey).toEqual('public~YAML');
    expect(detailsPageProps.pages[2].nameKey).toEqual('olm~Resources');
    expect(detailsPageProps.pages[3].nameKey).toEqual('public~Events');
  });
});

describe('ProvidedAPIsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(ReactRouter, 'useParams').mockReturnValue({
      ns: 'default',
      appName: 'testapp',
    });

    jest.spyOn(ReactRouter, 'useLocation').mockReturnValue({
      pathname: `/k8s/ns/default/${ClusterServiceVersionModel.plural}/testapp/instances`,
      search: '',
      state: null,
      hash: '',
      key: 'default',
    });
  });

  it('renders create dropdown when CSV has multiple owned CRDs', () => {
    const csv = _.cloneDeep(testClusterServiceVersion);
    csv.spec.customresourcedefinitions.owned.push({
      name: 'foobars.testapp.coreos.com',
      displayName: 'Foo Bars',
      version: 'v1',
      kind: 'FooBar',
    });

    renderWithProviders(<ProvidedAPIsPage obj={csv} />);

    expect(screen.getByText('Create new')).toBeInTheDocument();
  });
});

describe('ProvidedAPIPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(ReactRouter, 'useParams').mockReturnValue({
      ns: 'default',
      appName: 'testapp',
      plural: 'TestResource',
    });

    jest.spyOn(ReactRouter, 'useLocation').mockReturnValue({
      pathname: `/k8s/ns/default/${ClusterServiceVersionModel.plural}/testapp/TestResource`,
      search: '',
      state: null,
      hash: '',
      key: 'default',
    });
  });

  it('renders create button with correct text for single CRD', () => {
    renderWithProviders(<ProvidedAPIPage kind="TestResource" csv={testClusterServiceVersion} />);

    expect(screen.getByText('Create Test Resource')).toBeVisible();
  });
});
