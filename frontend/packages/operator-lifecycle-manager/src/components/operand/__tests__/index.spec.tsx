import type { ReactNode } from 'react';
import { screen } from '@testing-library/react';
import * as _ from 'lodash';
import * as ReactRouter from 'react-router';
import { DetailsPage } from '@console/internal/components/factory';
import type {
  CustomResourceDefinitionKind,
  K8sKind,
  K8sResourceKind,
} from '@console/internal/module/k8s';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { testClusterServiceVersion, testResourceInstance } from '../../../../mocks';
import { ClusterServiceVersionModel } from '../../../models';
import type { ClusterServiceVersionKind } from '../../../types';
import {
  OperandDetails,
  OperandDetailsPage,
  OperandStatus,
  OperandTableRow,
  ProvidedAPIPage,
  ProvidedAPIsPage,
} from '../index';

jest.mock('@patternfly/react-topology', () => ({}));

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => {
  const actual = jest.requireActual('@console/internal/components/utils/k8s-watch-hook');
  return {
    ...actual,
    // Avoid reselect dev warning ("result function returned its own inputs") from real hook in tests.
    useK8sWatchResources: jest.fn(() => ({})),
  };
});

jest.mock('@console/internal/kinds', () => ({
  ...jest.requireActual('@console/internal/kinds'),
  connectToModel: (Component: unknown) => Component,
}));

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
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

jest.mock('@console/shared/src/hooks/useConsoleDispatch', () => ({
  useConsoleDispatch: () => jest.fn(),
}));

jest.mock('@console/internal/components/factory', () => ({
  ...jest.requireActual('@console/internal/components/factory'),
  DetailsPage: jest.fn(() => null),
}));

jest.mock('@patternfly/react-core', () => {
  const actual = jest.requireActual('@patternfly/react-core');
  return {
    ...actual,
    Grid: ({ children }: { children?: ReactNode }) => <div data-test="mock-grid">{children}</div>,
    GridItem: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
    DescriptionList: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  };
});

jest.mock('@console/shared/src/components/layout/PaneBody', () => ({
  __esModule: true,
  default: ({ children, ...rest }: { children?: ReactNode; 'data-test'?: string }) => (
    <div data-test={rest['data-test'] ?? 'operand-pane-body'}>{children}</div>
  ),
}));

jest.mock('@console/internal/components/utils', () => ({
  ...jest.requireActual('@console/internal/components/utils'),
  ResourceSummary: () => <div data-test="operand-resource-summary">Resource summary</div>,
  SectionHeading: ({ text, ...rest }: { text: string; 'data-test'?: string }) => (
    <h2 data-test={rest['data-test'] ?? 'operand-overview-heading'}>{text}</h2>
  ),
}));

jest.mock('../../descriptors', () => ({
  ...jest.requireActual('../../descriptors'),
  DescriptorDetailsItem: () => null,
  DescriptorDetailsItems: () => null,
}));

jest.mock('../../descriptors/status/conditions', () => ({
  DescriptorConditions: () => null,
}));

const mockDetailsPage = DetailsPage as jest.Mock;

const testKindObj = {
  apiGroup: 'samples.console.openshift.io',
  apiVersion: 'v1alpha1',
  kind: 'Sample',
  label: 'Sample',
  labelPlural: 'Samples',
  plural: 'samples',
  namespaced: true,
  abbr: 'S',
  crd: true,
} as K8sKind;

const testCrd = {
  apiVersion: 'apiextensions.k8s.io/v1',
  kind: 'CustomResourceDefinition',
  metadata: { name: 'samples.samples.console.openshift.io' },
  spec: {
    versions: [{ name: 'v1alpha1', schema: { openAPIV3Schema: { type: 'object' } } }],
  },
} as CustomResourceDefinitionKind;

const testCsv = {
  apiVersion: 'operators.coreos.com/v1alpha1',
  kind: 'ClusterServiceVersion',
  metadata: { name: 'sample-csv', namespace: 'openshift-operators' },
  spec: {
    customresourcedefinitions: {
      owned: [
        {
          name: 'samples.samples.console.openshift.io',
          version: 'v1alpha1',
          kind: 'Sample',
          displayName: 'Sample Operand',
          specDescriptors: [],
          statusDescriptors: [],
        },
      ],
    },
  },
} as ClusterServiceVersionKind;

const baseOperand = {
  apiVersion: 'samples.console.openshift.io/v1alpha1',
  kind: 'Sample',
  metadata: { name: 'example', namespace: 'ns' },
  status: {},
} as K8sResourceKind;

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

    expect(screen.getByText(testResourceInstance.metadata.name)).toBeVisible();
    expect(screen.getByText(testResourceInstance.metadata.namespace)).toBeVisible();
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

    expect(screen.getByText(testResourceInstance.kind)).toBeVisible();
  });
});

describe('OperandStatus', () => {
  it('displays phase when present (highest priority)', () => {
    const operand = { status: { phase: 'Running', status: 'Active', state: 'Ready' } };
    renderWithProviders(<OperandStatus operand={operand} />);
    expect(screen.getByText('Phase')).toBeVisible();
    expect(screen.getByTestId('status-text')).toHaveTextContent('Running');
  });

  it('displays status when phase is not present', () => {
    const operand = { status: { status: 'Active', state: 'Ready' } };
    renderWithProviders(<OperandStatus operand={operand} />);
    expect(screen.getByText('Status')).toBeVisible();
    expect(screen.getByTestId('status-text')).toHaveTextContent('Active');
  });

  it('displays state when phase and status are not present', () => {
    const operand = { status: { state: 'Ready' } };
    renderWithProviders(<OperandStatus operand={operand} />);
    expect(screen.getByText('State')).toBeVisible();
    expect(screen.getByTestId('status-text')).toHaveTextContent('Ready');
  });

  it('displays condition type when conditions array has true status', () => {
    const operand = {
      status: {
        conditions: [
          { type: 'Failed', status: 'False' },
          { type: 'Available', status: 'True' },
        ],
      },
    };
    renderWithProviders(<OperandStatus operand={operand} />);
    expect(screen.getByText('Condition')).toBeVisible();
    expect(screen.getByTestId('status-text')).toHaveTextContent('Available');
  });

  it('displays multiple conditions when more than one is true', () => {
    const operand = {
      status: {
        conditions: [
          { type: 'Ready', status: 'True' },
          { type: 'Available', status: 'True' },
        ],
      },
    };
    renderWithProviders(<OperandStatus operand={operand} />);
    expect(screen.getByText('Conditions')).toBeVisible();
    expect(screen.getByTestId('status-text')).toHaveTextContent('Ready, Available');
  });

  it('displays condition when status.conditions is a single object with true status', () => {
    const operand = {
      status: {
        conditions: { type: 'Installed', status: 'True' },
      },
    };
    renderWithProviders(<OperandStatus operand={operand} />);
    expect(screen.getByText('Condition')).toBeVisible();
    expect(screen.getByTestId('status-text')).toHaveTextContent('Installed');
  });

  it('displays dash when conditions exist but none are true', () => {
    const operand = {
      status: {
        conditions: [
          { type: 'Ready', status: 'False' },
          { type: 'Available', status: 'False' },
        ],
      },
    };
    renderWithProviders(<OperandStatus operand={operand} />);
    expect(screen.getByText('-')).toBeVisible();
  });

  it('displays dash when no status information is available', () => {
    renderWithProviders(<OperandStatus operand={{}} />);
    expect(screen.getByText('-')).toBeVisible();
  });

  it('displays dash when status object exists but has no recognizable fields', () => {
    const operand = { status: { someOtherField: 'value' } };
    renderWithProviders(<OperandStatus operand={operand} />);
    expect(screen.getByText('-')).toBeVisible();
  });
});

describe('OperandDetails', () => {
  it('renders overview heading from CSV display name and resource summary', () => {
    renderWithProviders(
      <OperandDetails
        crd={testCrd}
        csv={testCsv}
        kindObj={testKindObj}
        obj={baseOperand}
        appName="sample-operator"
      />,
    );

    expect(screen.getByTestId('operand-overview-heading')).toHaveTextContent(/Sample Operand/);
    expect(screen.getByTestId('operand-resource-summary')).toBeVisible();
    expect(screen.getByTestId('operand-pane-body')).toBeVisible();
  });

  it('renders conditions region when status.conditions is present and no conditions descriptor overrides it', () => {
    const operandWithConditions = {
      ...baseOperand,
      status: {
        conditions: [{ type: 'Available', status: 'True', message: 'Ready' }],
      },
    } as K8sResourceKind;

    renderWithProviders(
      <OperandDetails
        crd={testCrd}
        csv={testCsv}
        kindObj={testKindObj}
        obj={operandWithConditions}
        appName="sample-operator"
      />,
    );

    expect(screen.getByTestId('operand-conditions-heading')).toBeVisible();
    expect(screen.getByTestId('operand-conditions-heading')).toHaveTextContent('Conditions');
    expect(screen.getByTestId('status.conditions')).toBeVisible();
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
      unstable_mask: undefined,
    });
  });

  it('renders without errors', () => {
    expect(() => {
      renderWithProviders(<OperandDetailsPage />);
    }).not.toThrow();
  });

  it('configures DetailsPage with Details, YAML, Resources, and Events tabs', () => {
    renderWithProviders(<OperandDetailsPage />);

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
      unstable_mask: undefined,
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

    expect(screen.getByText('Create new')).toBeVisible();
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
      unstable_mask: undefined,
    });
  });

  it('renders create button with correct text for single CRD', () => {
    renderWithProviders(<ProvidedAPIPage kind="TestResource" csv={testClusterServiceVersion} />);

    expect(screen.getByText('Create Test Resource')).toBeVisible();
  });
});
