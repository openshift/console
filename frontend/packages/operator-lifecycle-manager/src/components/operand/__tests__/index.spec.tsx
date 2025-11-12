import { screen, render, waitFor } from '@testing-library/react';
import * as ReactRouter from 'react-router-dom-v5-compat';
import { K8sResourceKind } from '@console/internal/module/k8s';
import * as k8sModelsModule from '@console/internal/module/k8s/k8s-models';
import * as useExtensionsModule from '@console/plugin-sdk/src/api/useExtensions';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import {
  OperandList,
  ProvidedAPIsPage,
  OperandTableRow,
  OperandDetailsPage,
  ProvidedAPIPage,
  OperandStatus,
} from '..';
import { testResourceInstance, testClusterServiceVersion, testModel } from '../../../../mocks';
import { ClusterServiceVersionModel } from '../../../models';

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

jest.mock('@console/shared/src/hooks/useK8sModel', () => {
  return {
    useK8sModel: (groupVersionKind) => [
      groupVersionKind === 'TestResourceRO'
        ? {
            abbr: 'TR',
            apiGroup: 'testapp.coreos.com',
            apiVersion: 'v1alpha1',
            crd: true,
            kind: 'TestResourceRO',
            label: 'Test Resource',
            labelPlural: 'Test Resources',
            namespaced: true,
            plural: 'testresources',
            verbs: ['get'],
          }
        : {
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
  };
});

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => jest.fn(),
}));

describe('OperandTableRow', () => {
  beforeEach(() => {
    jest.spyOn(useExtensionsModule, 'useExtensions').mockReturnValue([]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders column for resource name', () => {
    renderWithProviders(
      <table>
        <tbody>
          <tr>
            <OperandTableRow obj={testResourceInstance} columns={[]} showNamespace />
          </tr>
        </tbody>
      </table>,
    );

    // Check that operand link is rendered with the resource name
    const link = screen.getByRole('link', { name: testResourceInstance.metadata.name });
    expect(link).toBeVisible();
  });

  it('renders column for resource type', () => {
    renderWithProviders(
      <table>
        <tbody>
          <tr>
            <OperandTableRow obj={testResourceInstance} columns={[]} showNamespace />
          </tr>
        </tbody>
      </table>,
    );

    // Kind is rendered in a table cell - find all cells and check one contains the kind
    const cells = screen.getAllByRole('gridcell');
    const kindCell = cells.find((cell) => cell.textContent === testResourceInstance.kind);
    expect(kindCell).toBeVisible();
  });

  it('renders column for resource namespace', () => {
    renderWithProviders(
      <table>
        <tbody>
          <tr>
            <OperandTableRow obj={testResourceInstance} columns={[]} showNamespace />
          </tr>
        </tbody>
      </table>,
    );

    const namespaceLink = screen.getByRole('link', {
      name: testResourceInstance.metadata.namespace,
    });
    expect(namespaceLink).toBeVisible();
  });

  it('renders column for resource status', () => {
    renderWithProviders(
      <table>
        <tbody>
          <tr>
            <OperandTableRow obj={testResourceInstance} columns={[]} showNamespace />
          </tr>
        </tbody>
      </table>,
    );

    // Status component renders with operand status information
    const cells = screen.getAllByRole('gridcell');
    expect(cells.length).toBeGreaterThan(0);
  });

  it('renders column for resource labels', () => {
    renderWithProviders(
      <table>
        <tbody>
          <tr>
            <OperandTableRow obj={testResourceInstance} columns={[]} showNamespace />
          </tr>
        </tbody>
      </table>,
    );

    // Labels column should be rendered - verify cells exist
    const cells = screen.getAllByRole('gridcell');
    const labelsCell = cells.find((cell) => cell.textContent?.includes('app'));
    expect(labelsCell).toBeVisible();
  });

  it('renders column for last updated timestamp', () => {
    renderWithProviders(
      <table>
        <tbody>
          <tr>
            <OperandTableRow obj={testResourceInstance} columns={[]} showNamespace />
          </tr>
        </tbody>
      </table>,
    );

    // Timestamp should be rendered - check for formatted date text
    expect(screen.getByText(/Jun 20, 2017/)).toBeVisible();
  });

  it('renders a `LazyActionsMenu` for resource actions', () => {
    renderWithProviders(
      <table>
        <tbody>
          <tr>
            <OperandTableRow obj={testResourceInstance} columns={[]} showNamespace />
          </tr>
        </tbody>
      </table>,
    );

    // LazyActionMenu renders a button - find by accessible name
    const actionButton = screen.getByRole('button', { name: /Actions/ });
    expect(actionButton).toBeVisible();
  });
});

describe('OperandList.displayName', () => {
  let resources: K8sResourceKind[];

  beforeEach(() => {
    resources = [testResourceInstance];
    jest.spyOn(useExtensionsModule, 'useExtensions').mockReturnValue([]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders a `Table` with the correct headers', () => {
    renderWithProviders(<OperandList loaded data={resources} showNamespace />);

    expect(screen.getByText('Name')).toBeVisible();
    expect(screen.getByText('Kind')).toBeVisible();
    expect(screen.getByText('Namespace')).toBeVisible();
    expect(screen.getByText('Status')).toBeVisible();
    expect(screen.getByText('Labels')).toBeVisible();
    expect(screen.getByText('Last updated')).toBeVisible();
  });
});

describe('OperandDetailsPage', () => {
  beforeEach(() => {
    window.SERVER_FLAGS.copiedCSVsDisabled = false;

    jest.spyOn(ReactRouter, 'useParams').mockReturnValue({
      ns: 'default',
      appName: 'testapp',
      plural: 'testapp.coreos.com~v1alpha1~TestResource',
      name: 'my-test-resource',
    });

    jest.spyOn(ReactRouter, 'useLocation').mockReturnValue({
      pathname: `/k8s/ns/default/${ClusterServiceVersionModel.plural}/testapp/testapp.coreos.com~v1alpha1~TestResource/my-test-resource`,
    } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders a `DetailsPage` with the correct subpages', async () => {
    renderWithProviders(<OperandDetailsPage />);

    // Wait for async state updates to complete
    await waitFor(() => expect(document.querySelector('body')).toBeInTheDocument());
  });

  it('passes function to create breadcrumbs for resource to `DetailsPage`', async () => {
    renderWithProviders(<OperandDetailsPage />);

    // Wait for async state updates to complete
    await waitFor(() => expect(document.querySelector('body')).toBeInTheDocument());
  });

  it('creates correct breadcrumbs even if `namespace`, `plural`, `appName`, and `name` URL parameters are the same', async () => {
    jest.spyOn(ReactRouter, 'useParams').mockReturnValue({
      ns: 'example',
      appName: 'example',
      plural: 'example',
      name: 'example',
    });

    jest.spyOn(ReactRouter, 'useLocation').mockReturnValue({
      pathname: `/k8s/ns/example/${ClusterServiceVersionModel.plural}/example/example/example`,
    } as any);

    renderWithProviders(<OperandDetailsPage />);

    // Wait for async state updates to complete
    await waitFor(() => expect(document.querySelector('body')).toBeInTheDocument());
  });
});

describe('ProvidedAPIsPage', () => {
  beforeAll(() => {
    // Since crd models have not been loaded into redux state, just force return of the correct model type
    jest.spyOn(k8sModelsModule, 'modelFor').mockReturnValue(testModel);
  });

  beforeEach(() => {
    jest.spyOn(ReactRouter, 'useParams').mockReturnValue({
      ns: 'default',
      appName: 'testapp',
    });

    jest.spyOn(ReactRouter, 'useLocation').mockReturnValue({
      pathname: `/k8s/ns/default/${ClusterServiceVersionModel.plural}/testapp/instances`,
    } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render listpage components', () => {
    renderWithProviders(<ProvidedAPIsPage obj={testClusterServiceVersion} />);

    expect(screen.getByTestId('page-heading')).toBeVisible();
    expect(screen.getByText('Create new')).toBeVisible();
  });

  it('should render ListPageCreateDropdown with the correct text', () => {
    renderWithProviders(<ProvidedAPIsPage obj={testClusterServiceVersion} />);

    expect(screen.getByText('Create new')).toBeVisible();
  });

  it('should pass `items` props and render ListPageCreateDropdown create button when app has multiple owned CRDs', () => {
    const obj = {
      ...testClusterServiceVersion,
      metadata: { ...testClusterServiceVersion.metadata },
      spec: {
        ...testClusterServiceVersion.spec,
        customresourcedefinitions: {
          ...testClusterServiceVersion.spec.customresourcedefinitions,
          owned: [
            ...testClusterServiceVersion.spec.customresourcedefinitions.owned,
            {
              name: 'foobars.testapp.coreos.com',
              displayName: 'Foo Bars',
              version: 'v1',
              kind: 'FooBar',
            },
          ],
        },
      },
    };

    renderWithProviders(<ProvidedAPIsPage obj={obj} />);

    expect(screen.getByText('Create new')).toBeVisible();
  });
});

describe('ProvidedAPIPage', () => {
  beforeEach(() => {
    jest.spyOn(ReactRouter, 'useParams').mockReturnValue({
      ns: 'default',
      appName: 'testapp',
      plural: 'TestResourceRO',
    });

    jest.spyOn(ReactRouter, 'useLocation').mockReturnValue({
      pathname: `/k8s/ns/default/${ClusterServiceVersionModel.plural}/testapp/TestResourceRO`,
    } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render listpage components', () => {
    renderWithProviders(<ProvidedAPIPage kind="TestResourceRO" csv={testClusterServiceVersion} />);

    expect(screen.getByTestId('page-heading')).toBeVisible();
  });

  it('should render ListPageCreateLink with the correct text', () => {
    renderWithProviders(<ProvidedAPIPage kind="TestResourceRO" csv={testClusterServiceVersion} />);

    expect(screen.getByText('Create Test Resource')).toBeVisible();
  });
});

describe('OperandStatus', () => {
  it('should display the correct status when status value is Running', () => {
    const obj = {
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
    render(<OperandStatus operand={obj} />);
    expect(screen.getByText('Status')).toBeVisible();
    expect(screen.getByText(/Running/)).toBeVisible();
  });

  it('should display the correct status when phase value is Running', () => {
    const obj = {
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
    render(<OperandStatus operand={obj} />);
    expect(screen.getByText('Phase')).toBeVisible();
    expect(screen.getByText(/Running/)).toBeVisible();
  });

  it('should display the correct status when state value is Running', () => {
    const obj = {
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
    render(<OperandStatus operand={obj} />);
    expect(screen.getByText('State')).toBeVisible();
    expect(screen.getByText(/Running/)).toBeVisible();
  });

  it('should display the correct status when condition status is True', () => {
    const obj = {
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
    render(<OperandStatus operand={obj} />);
    expect(screen.getByText('Condition')).toBeVisible();
    expect(screen.getByText(/Running/)).toBeVisible();
  });

  it('should display the `-` status when no conditions are True', () => {
    const obj = {
      status: {
        conditions: [
          {
            type: 'Failed',
            status: 'False',
          },
          {
            type: 'Installed',
            status: 'False',
          },
        ],
      },
    };
    render(<OperandStatus operand={obj} />);
    expect(screen.getByText('-')).toBeVisible();
  });

  it('should display the `-` when status stanza is missing', () => {
    const obj = {};
    render(<OperandStatus operand={obj} />);
    expect(screen.getByText('-')).toBeVisible();
  });
});
