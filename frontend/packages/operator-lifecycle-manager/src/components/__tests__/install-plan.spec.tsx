import { screen, fireEvent, waitFor } from '@testing-library/react';
import * as _ from 'lodash';
import * as Router from 'react-router-dom-v5-compat';
import * as k8sResourceModule from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource';
import { Table, MultiListPage, DetailsPage } from '@console/internal/components/factory';
import { useAccessReview } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { testInstallPlan } from '../../../mocks';
import { InstallPlanModel, ClusterServiceVersionModel, OperatorGroupModel } from '../../models';
import { InstallPlanKind, InstallPlanApproval } from '../../types';
import {
  InstallPlanTableRow,
  InstallPlansList,
  InstallPlansPage,
  InstallPlanDetailsPage,
  InstallPlanPreview,
  InstallPlanDetails,
} from '../install-plan';

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useParams: jest.fn(),
}));

jest.mock('@console/internal/components/utils/rbac', () => ({
  useAccessReview: jest.fn(),
  asAccessReview: jest.fn(() => ({})),
}));

jest.mock('@console/internal/components/factory', () => ({
  ...jest.requireActual('@console/internal/components/factory'),
  Table: jest.fn(() => null),
  MultiListPage: jest.fn(() => null),
  DetailsPage: jest.fn(() => null),
}));

const mockTable = Table as jest.Mock;
const mockMultiListPage = MultiListPage as jest.Mock;
const mockDetailsPage = DetailsPage as jest.Mock;
const mockUseAccessReview = useAccessReview as jest.Mock;

describe('InstallPlanTableRow', () => {
  let installPlan: InstallPlanKind;
  const columns = [];

  beforeEach(() => {
    jest.clearAllMocks();
    installPlan = _.cloneDeep(testInstallPlan);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders install plan name with correct resource link', () => {
    renderWithProviders(
      <table>
        <tbody>
          <tr>
            <InstallPlanTableRow obj={installPlan} columns={columns} />
          </tr>
        </tbody>
      </table>,
    );

    const installPlanLinks = screen.getAllByText(installPlan.metadata.name);
    const installPlanLink = installPlanLinks.find((link) =>
      link.getAttribute('href')?.includes('InstallPlan'),
    );
    expect(installPlanLink).toBeVisible();
  });

  it('renders install plan namespace', () => {
    renderWithProviders(
      <table>
        <tbody>
          <tr>
            <InstallPlanTableRow obj={installPlan} columns={columns} />
          </tr>
        </tbody>
      </table>,
    );

    expect(screen.getByText(installPlan.metadata.namespace)).toBeVisible();
  });

  it('renders install plan status', () => {
    renderWithProviders(
      <table>
        <tbody>
          <tr>
            <InstallPlanTableRow obj={installPlan} columns={columns} />
          </tr>
        </tbody>
      </table>,
    );

    const statusElement = screen.getByTestId('status-text');
    expect(statusElement).toHaveTextContent(installPlan.status.phase);
  });

  it('renders fallback status when status.phase is undefined', () => {
    const installPlanWithoutStatus = { ...installPlan, status: null };

    renderWithProviders(
      <table>
        <tbody>
          <tr>
            <InstallPlanTableRow obj={installPlanWithoutStatus} columns={columns} />
          </tr>
        </tbody>
      </table>,
    );

    expect(screen.getByText('Unknown')).toBeVisible();
  });

  it('renders CSV component name', () => {
    renderWithProviders(
      <table>
        <tbody>
          <tr>
            <InstallPlanTableRow obj={installPlan} columns={columns} />
          </tr>
        </tbody>
      </table>,
    );

    const csvName = installPlan.spec.clusterServiceVersionNames[0];
    const csvLinks = screen.getAllByText(csvName);
    const csvLink = csvLinks.find((link) =>
      link.getAttribute('href')?.includes('ClusterServiceVersion'),
    );
    expect(csvLink).toBeVisible();
  });
});

describe('InstallPlansList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTable.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders Table component with correct header titles', () => {
    renderWithProviders(<InstallPlansList.WrappedComponent operatorGroup={null} />);

    expect(mockTable).toHaveBeenCalledTimes(1);
    const [tableProps] = mockTable.mock.calls[0];

    const headers = tableProps.Header({});
    const headerTitles = headers.map((header) => header.title);

    expect(headerTitles).toEqual([
      'Name',
      'Namespace',
      'Status',
      'Components',
      'Subscriptions',
      '',
    ]);
  });

  it('provides custom empty message for table', () => {
    renderWithProviders(<InstallPlansList.WrappedComponent operatorGroup={null} />);

    expect(mockTable).toHaveBeenCalledTimes(1);
    const [tableProps] = mockTable.mock.calls[0];

    expect(tableProps.EmptyMsg).toBeDefined();
  });
});

describe('InstallPlansPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Router, 'useParams').mockReturnValue({ ns: 'default' });
    mockMultiListPage.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders MultiListPage with correct configuration', () => {
    renderWithProviders(<InstallPlansPage />);

    expect(mockMultiListPage).toHaveBeenCalledTimes(1);
    const [multiListPageProps] = mockMultiListPage.mock.calls[0];

    expect(multiListPageProps.title).toEqual('InstallPlans');
    expect(multiListPageProps.showTitle).toBe(false);
    expect(multiListPageProps.ListComponent).toEqual(InstallPlansList);
  });

  it('fetches InstallPlans and OperatorGroups from correct namespace', () => {
    renderWithProviders(<InstallPlansPage />);

    expect(mockMultiListPage).toHaveBeenCalledTimes(1);
    const [multiListPageProps] = mockMultiListPage.mock.calls[0];

    expect(multiListPageProps.resources).toEqual([
      {
        kind: referenceForModel(InstallPlanModel),
        namespace: 'default',
        namespaced: true,
        prop: 'installPlan',
      },
      {
        kind: referenceForModel(OperatorGroupModel),
        namespace: 'default',
        namespaced: true,
        prop: 'operatorGroup',
      },
    ]);
  });
});

describe('InstallPlanPreview', () => {
  let installPlan: InstallPlanKind;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAccessReview.mockReturnValue(true);

    installPlan = {
      ...testInstallPlan,
      status: {
        ...testInstallPlan.status,
        plan: [
          {
            resolving: 'testoperator.v1.0.0',
            status: 'Created',
            resource: {
              group: ClusterServiceVersionModel.apiGroup,
              version: ClusterServiceVersionModel.apiVersion,
              kind: ClusterServiceVersionModel.kind,
              name: 'testoperator.v1.0.0',
              manifest: '',
            },
          },
          {
            resolving: 'testoperator.v1.0.0',
            status: 'Unknown',
            resource: {
              group: 'apiextensions.k8s.io',
              version: 'v1',
              kind: 'CustomResourceDefinition',
              name: 'test-crds.test.com',
              manifest: '',
            },
          },
        ],
      },
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders empty message when status.plan is empty', () => {
    const emptyPlan = { ...installPlan, status: { ...installPlan.status, plan: [] } };

    renderWithProviders(<InstallPlanPreview obj={emptyPlan} />);

    expect(screen.getByText(/no components resolved/i)).toBeVisible();
  });

  it('renders Approve button when install plan requires approval', () => {
    const manualPlan = {
      ...installPlan,
      spec: {
        ...installPlan.spec,
        approval: InstallPlanApproval.Manual,
        approved: false,
      },
    };

    renderWithProviders(<InstallPlanPreview obj={manualPlan} />);

    expect(screen.getByRole('button', { name: 'Approve' })).toBeVisible();
  });

  it('calls k8sPatch to approve install plan when Approve button is clicked', async () => {
    const k8sPatchSpy = jest.spyOn(k8sResourceModule, 'k8sPatch').mockResolvedValue(installPlan);

    const manualPlan = {
      ...installPlan,
      spec: {
        ...installPlan.spec,
        approval: InstallPlanApproval.Manual,
        approved: false,
      },
    };

    renderWithProviders(<InstallPlanPreview obj={manualPlan} />);

    const approveButton = screen.getByRole('button', { name: 'Approve' });
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(k8sPatchSpy).toHaveBeenCalledWith(
        InstallPlanModel,
        manualPlan,
        expect.arrayContaining([
          expect.objectContaining({
            op: 'replace',
            path: '/spec/approved',
            value: true,
          }),
        ]),
      );
    });
  });

  it('renders Deny button when install plan requires approval', () => {
    const manualPlan = {
      ...installPlan,
      spec: {
        ...installPlan.spec,
        approval: InstallPlanApproval.Manual,
        approved: false,
      },
    };

    renderWithProviders(<InstallPlanPreview obj={manualPlan} />);

    expect(screen.getByRole('button', { name: 'Deny' })).toBeVisible();
  });

  it('renders component names from install plan', () => {
    renderWithProviders(<InstallPlanPreview obj={installPlan} />);

    const resourceName = installPlan.status.plan[0].resource.name;
    const elements = screen.getAllByText(resourceName);
    expect(elements.length).toBeGreaterThan(0);
    expect(elements[0]).toBeVisible();
  });

  it('renders preview button for uncreated components', () => {
    renderWithProviders(<InstallPlanPreview obj={installPlan} />);

    const uncreatedStep = installPlan.status.plan.find((step) => step.status === 'Unknown');
    expect(screen.getByRole('button', { name: uncreatedStep.resource.name })).toBeVisible();
  });
});

describe('InstallPlanDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders link to Components tab when install plan needs approval', () => {
    mockUseAccessReview.mockReturnValue(true);
    const manualPlan = {
      ...testInstallPlan,
      spec: {
        ...testInstallPlan.spec,
        approval: InstallPlanApproval.Manual,
        approved: false,
      },
    };

    renderWithProviders(<InstallPlanDetails obj={manualPlan} />);

    const previewButton = screen.getByRole('button', { name: 'Preview InstallPlan' });
    expect(previewButton).toBeVisible();

    const link = previewButton.closest('a');
    expect(link).toHaveAttribute(
      'href',
      `/k8s/ns/default/${referenceForModel(InstallPlanModel)}/${
        testInstallPlan.metadata.name
      }/components`,
    );
  });

  it('does not render Components link when install plan is automatic', () => {
    mockUseAccessReview.mockReturnValue(true);
    const automaticPlan = {
      ...testInstallPlan,
      spec: {
        ...testInstallPlan.spec,
        approval: InstallPlanApproval.Automatic,
        approved: true,
      },
    };

    renderWithProviders(<InstallPlanDetails obj={automaticPlan} />);

    expect(screen.queryByRole('button', { name: 'Preview InstallPlan' })).not.toBeInTheDocument();
  });
});

describe('InstallPlanDetailsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .spyOn(Router, 'useParams')
      .mockReturnValue({ ns: 'default', name: testInstallPlan.metadata.name });
    mockDetailsPage.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders DetailsPage with three navigation tabs', () => {
    renderWithProviders(<InstallPlanDetailsPage />);

    expect(mockDetailsPage).toHaveBeenCalledTimes(1);
    const [detailsPageProps] = mockDetailsPage.mock.calls[0];

    const pageNames = detailsPageProps.pages.map((p) => p.name || p.nameKey);
    expect(pageNames).toEqual(['public~Details', 'public~YAML', 'olm~Components']);
  });
});
