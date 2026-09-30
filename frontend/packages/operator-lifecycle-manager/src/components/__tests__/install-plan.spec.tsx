import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as _ from 'lodash';
import * as Router from 'react-router';
import { ConsoleDataView } from '@console/app/src/components/data-view/ConsoleDataView';
import type { ConsoleDataViewColumn } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import * as k8sResourceModule from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource';
import { MultiListPage, DetailsPage } from '@console/internal/components/factory';
import { useAccessReview } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import {
  renderHookWithProviders,
  renderWithProviders,
} from '@console/shared/src/test-utils/unit-test-utils';
import { testInstallPlan } from '../../../mocks';
import { InstallPlanModel, ClusterServiceVersionModel, OperatorGroupModel } from '../../models';
import type { InstallPlanKind } from '../../types';
import { InstallPlanApproval } from '../../types';
import {
  getInstallPlanDataViewRows,
  useInstallPlanColumns,
  InstallPlansList,
  InstallPlansPage,
  InstallPlanDetailsPage,
  InstallPlanPreview,
  InstallPlanDetails,
} from '../install-plan';

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useParams: jest.fn(),
}));

jest.mock('@console/internal/components/utils/rbac', () => ({
  useAccessReview: jest.fn(),
  asAccessReview: jest.fn(() => ({})),
}));

jest.mock('@console/internal/components/factory', () => ({
  ...jest.requireActual('@console/internal/components/factory'),
  MultiListPage: jest.fn(() => null),
  DetailsPage: jest.fn(() => null),
}));

jest.mock('@console/app/src/components/data-view/ConsoleDataView', () => ({
  ...jest.requireActual('@console/app/src/components/data-view/ConsoleDataView'),
  ConsoleDataView: jest.fn(() => null),
}));

jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource', () => ({
  ...jest.requireActual('@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource'),
  k8sPatch: jest.fn(),
}));

const k8sPatchMock = k8sResourceModule.k8sPatch as jest.Mock;
const mockConsoleDataView = ConsoleDataView as unknown as jest.Mock;
const mockMultiListPage = MultiListPage as jest.Mock;
const mockDetailsPage = DetailsPage as jest.Mock;
const mockUseAccessReview = useAccessReview as jest.Mock;

const renderRow = (obj: InstallPlanKind, ids: string[]) => {
  const columns: ConsoleDataViewColumn<InstallPlanKind>[] = ids.map((id) => ({ id, title: id }));
  const [cells] = getInstallPlanDataViewRows(
    [{ obj, activeColumnIDs: new Set(ids), rowData: undefined, index: 0 }],
    columns,
  );
  return renderWithProviders(
    <table>
      <tbody>
        <tr>
          {cells.map(({ id, cell }) => (
            <td key={id}>{cell}</td>
          ))}
        </tr>
      </tbody>
    </table>,
  );
};

describe('getInstallPlanDataViewRows', () => {
  let installPlan: InstallPlanKind;

  beforeEach(() => {
    jest.clearAllMocks();
    installPlan = _.cloneDeep(testInstallPlan);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders install plan name with correct resource link', () => {
    renderRow(installPlan, ['name']);
    const installPlanLinks = screen.getAllByRole('link', { name: installPlan.metadata.name });
    // eslint-disable-next-line testing-library/no-node-access -- Multiple links with same name require href filtering
    const installPlanLink = installPlanLinks.find((link) =>
      link.getAttribute('href')?.includes('InstallPlan'),
    );
    expect(installPlanLink).toBeVisible();
  });

  it('renders install plan namespace', () => {
    renderRow(installPlan, ['namespace']);
    expect(screen.getByText(installPlan.metadata.namespace)).toBeVisible();
  });

  it('renders install plan status', () => {
    renderRow(installPlan, ['status']);
    expect(screen.getByTestId('status-text')).toHaveTextContent(installPlan.status.phase);
  });

  it('renders fallback status when status.phase is undefined', () => {
    renderRow({ ...installPlan, status: null }, ['status']);
    expect(screen.getByText('Unknown')).toBeVisible();
  });

  it('renders CSV component name', () => {
    renderRow(installPlan, ['components']);
    const csvName = installPlan.spec.clusterServiceVersionNames[0];
    const csvLinks = screen.getAllByRole('link', { name: csvName });
    // eslint-disable-next-line testing-library/no-node-access -- Multiple links with same name require href filtering
    const csvLink = csvLinks.find((link) =>
      link.getAttribute('href')?.includes('ClusterServiceVersion'),
    );
    expect(csvLink).toBeVisible();
  });

  it('renders owning Subscriptions', () => {
    renderRow(installPlan, ['subscriptions']);
    const subscriptionRef = installPlan.metadata.ownerReferences.find(
      (ref) => ref.kind === 'Subscription',
    );
    expect(screen.getByRole('link', { name: subscriptionRef.name })).toBeVisible();
  });

  it('renders None when no Subscription owns the InstallPlan', () => {
    renderRow({ ...installPlan, metadata: { ...installPlan.metadata, ownerReferences: [] } }, [
      'subscriptions',
    ]);
    expect(screen.getByText('None')).toBeVisible();
  });

  it('preserves the requested column order and omits inactive columns', () => {
    renderRow(installPlan, ['namespace', 'name']);
    const cells = screen.getAllByRole('cell');
    expect(cells).toHaveLength(2);
    expect(cells[0]).toHaveTextContent(installPlan.metadata.namespace);
    expect(cells[1]).toHaveTextContent(installPlan.metadata.name);
  });
});

describe('useInstallPlanColumns', () => {
  it('returns the expected column titles', () => {
    const { result } = renderHookWithProviders(() => useInstallPlanColumns());
    expect(result.current.columns.map(({ title }) => title)).toEqual([
      'Name',
      'Namespace',
      'Status',
      'Components',
      'Subscriptions',
      '',
    ]);
  });

  it('makes every column except actions resizable', () => {
    const { result } = renderHookWithProviders(() => useInstallPlanColumns());
    expect(result.current.columns.map(({ id, resizableProps }) => [id, !!resizableProps])).toEqual([
      ['name', true],
      ['namespace', true],
      ['status', true],
      ['components', true],
      ['subscriptions', true],
      ['actions', false],
    ]);
  });
});

describe('InstallPlansList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleDataView.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders ConsoleDataView with resizable columns', () => {
    renderWithProviders(
      <InstallPlansList.WrappedComponent operatorGroup={null} data={[testInstallPlan]} loaded />,
    );

    expect(mockConsoleDataView).toHaveBeenCalledTimes(1);
    const [dataViewProps] = mockConsoleDataView.mock.calls[0];
    expect(dataViewProps.columns.map((column) => column.title)).toEqual([
      'Name',
      'Namespace',
      'Status',
      'Components',
      'Subscriptions',
      '',
    ]);
    expect(dataViewProps.isResizable).toBe(true);
    expect(dataViewProps.resetAllColumnWidths).toEqual(expect.any(Function));
    expect(dataViewProps.hideColumnManagement).toBe(true);
  });

  it('renders the custom empty message instead of the table when no InstallPlans exist', () => {
    renderWithProviders(
      <InstallPlansList.WrappedComponent operatorGroup={null} data={[]} loaded />,
    );

    expect(mockConsoleDataView).not.toHaveBeenCalled();
    expect(screen.getByText('No InstallPlans found')).toBeVisible();
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
    expect(multiListPageProps.omitFilterToolbar).toBe(true);
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
    k8sPatchMock.mockResolvedValue(installPlan);

    const manualPlan = {
      ...installPlan,
      spec: {
        ...installPlan.spec,
        approval: InstallPlanApproval.Manual,
        approved: false,
      },
    };

    renderWithProviders(<InstallPlanPreview obj={manualPlan} />);

    const user = userEvent.setup();
    const approveButton = screen.getByRole('button', { name: 'Approve' });
    await user.click(approveButton);

    await waitFor(() => {
      expect(k8sPatchMock).toHaveBeenCalledWith(
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

    const link = screen.getByRole('link', { name: 'Preview InstallPlan' });
    expect(link).toBeVisible();
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
