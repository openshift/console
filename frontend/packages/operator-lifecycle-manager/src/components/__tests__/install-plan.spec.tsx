import { screen, fireEvent, waitFor } from '@testing-library/react';
import * as Router from 'react-router-dom-v5-compat';
import * as k8sResourceModule from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource';
import { RowFunctionArgs } from '@console/internal/components/factory';
import { useAccessReview } from '@console/internal/components/utils/rbac';
import { CustomResourceDefinitionModel } from '@console/internal/models';
import { referenceForModel, K8sResourceKind } from '@console/internal/module/k8s';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { testInstallPlan } from '../../../mocks';
import { InstallPlanModel, ClusterServiceVersionModel } from '../../models';
import { InstallPlanKind, InstallPlanApproval } from '../../types';
import {
  InstallPlanTableRow,
  InstallPlansList,
  InstallPlansPage,
  InstallPlanDetailsPage,
  InstallPlanPreview,
  InstallPlanDetails,
} from '../install-plan';
import * as modal from '../modals/installplan-preview-modal';

jest.mock('../operator-group', () => ({
  requireOperatorGroup: (component) => component,
}));

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useParams: jest.fn(),
}));

jest.mock('@console/internal/components/utils/rbac', () => ({
  useAccessReview: jest.fn(),
}));

const useAccessReviewMock = useAccessReview as jest.Mock;

// Helper to render InstallPlanTableRow in proper table structure
const renderTableRow = (rowArgs: RowFunctionArgs<K8sResourceKind>) =>
  renderWithProviders(
    <table>
      <tbody>
        <tr>
          <InstallPlanTableRow {...rowArgs} />
        </tr>
      </tbody>
    </table>,
  );

describe('InstallPlanTableRow', () => {
  let obj: InstallPlanKind;

  beforeEach(() => {
    obj = {
      ...testInstallPlan,
      metadata: { ...testInstallPlan.metadata },
      spec: { ...testInstallPlan.spec },
      status: { ...testInstallPlan.status },
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders resource kebab for performing common actions', () => {
    const rowArgs: RowFunctionArgs<K8sResourceKind> = {
      obj,
      columns: [],
    };

    renderTableRow(rowArgs);

    expect(screen.getAllByRole('gridcell')).toHaveLength(6);
  });

  it('renders column for install plan name', () => {
    const rowArgs: RowFunctionArgs<K8sResourceKind> = {
      obj,
      columns: [],
    };

    renderTableRow(rowArgs);

    // Get all links with the name and find the one for the install plan (not namespace)
    const nameLinks = screen.getAllByRole('link', { name: testInstallPlan.metadata.name });
    const installPlanLink = nameLinks.find((link) =>
      (link as HTMLAnchorElement).href?.includes(referenceForModel(InstallPlanModel)),
    );
    expect(installPlanLink).toBeVisible();
    expect(installPlanLink).toHaveAttribute(
      'href',
      `/k8s/ns/${testInstallPlan.metadata.namespace}/${referenceForModel(InstallPlanModel)}/${
        testInstallPlan.metadata.name
      }`,
    );
  });

  it('renders column for install plan namespace', () => {
    const rowArgs: RowFunctionArgs<K8sResourceKind> = {
      obj,
      columns: [],
    };

    renderTableRow(rowArgs);

    expect(screen.getByRole('link', { name: testInstallPlan.metadata.namespace })).toBeVisible();
  });

  it('renders column for install plan status', () => {
    const rowArgs: RowFunctionArgs<K8sResourceKind> = {
      obj,
      columns: [],
    };

    renderTableRow(rowArgs);

    // Status component renders the phase
    expect(screen.getByText(testInstallPlan.status.phase)).toBeVisible();
  });

  it('renders column with fallback status if `status.phase` is undefined', () => {
    obj = {
      ...testInstallPlan,
      metadata: { ...testInstallPlan.metadata },
      spec: { ...testInstallPlan.spec },
      status: null,
    };
    const rowArgs: RowFunctionArgs<K8sResourceKind> = {
      obj,
      columns: [],
    };

    renderTableRow(rowArgs);

    expect(screen.getByText('Unknown')).toBeVisible();
  });

  it('render column for install plan components list', () => {
    const rowArgs: RowFunctionArgs<K8sResourceKind> = {
      obj,
      columns: [],
    };

    renderTableRow(rowArgs);

    // Get all links with the CSV name and find the correct one
    const componentLinks = screen.getAllByRole('link', {
      name: testInstallPlan.spec.clusterServiceVersionNames.toString(),
    });
    const csvLink = componentLinks.find((link) =>
      (link as HTMLAnchorElement).href?.includes(referenceForModel(ClusterServiceVersionModel)),
    );
    expect(csvLink).toBeVisible();
    expect(csvLink).toHaveAttribute(
      'href',
      `/k8s/ns/${testInstallPlan.metadata.namespace}/${referenceForModel(
        ClusterServiceVersionModel,
      )}/${testInstallPlan.spec.clusterServiceVersionNames.toString()}`,
    );
  });

  it('renders column for parent subscription(s) determined by `metadata.ownerReferences`', () => {
    const rowArgs: RowFunctionArgs<K8sResourceKind> = {
      obj,
      columns: [],
    };

    renderTableRow(rowArgs);

    // Check that at least one subscription link is rendered
    const subscriptionLinks = screen
      .getAllByRole('link')
      .filter((link) => (link as HTMLAnchorElement).href?.includes('Subscription'));
    expect(subscriptionLinks.length).toBeGreaterThan(0);
  });
});

describe('InstallPlansList', () => {
  it('renders without errors when wrapped by requireOperatorGroup HOC', () => {
    expect(() => {
      renderWithProviders(<InstallPlansList operatorGroup={{ loaded: true, data: [] }} />);
    }).not.toThrow();
  });
});

describe('InstallPlansPage', () => {
  beforeEach(() => {
    jest.spyOn(Router, 'useParams').mockReturnValue({
      ns: 'default',
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders a `MultiListPage` with the correct props', () => {
    // Verify the MultiListPage renders without errors
    expect(() => {
      renderWithProviders(<InstallPlansPage />);
    }).not.toThrow();
  });
});

describe('InstallPlanPreview', () => {
  const obj: InstallPlanKind = {
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
            group: CustomResourceDefinitionModel.apiGroup,
            version: CustomResourceDefinitionModel.apiVersion,
            kind: CustomResourceDefinitionModel.kind,
            name: 'test-crds.test.com',
            manifest: '',
          },
        },
      ],
    },
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders empty message if `status.plan` is not filled', () => {
    renderWithProviders(
      <InstallPlanPreview obj={{ ...obj, status: { ...obj.status, plan: [] } }} />,
    );
    expect(screen.getByText('No components resolved')).toBeVisible();
    expect(screen.getByText(/This InstallPlan has not been fully resolved yet/)).toBeVisible();
  });

  it('renders button to approve install plan if requires approval', () => {
    useAccessReviewMock.mockReturnValue(true);
    renderWithProviders(
      <InstallPlanPreview
        obj={{
          ...obj,
          spec: {
            ...obj.spec,
            approval: InstallPlanApproval.Manual,
            approved: false,
          },
        }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Approve' })).toBeVisible();
  });

  it('calls `k8sPatch` to set `approved: true` when button is clicked', async () => {
    useAccessReviewMock.mockReturnValue(true);
    const k8sPatchSpy = jest
      .spyOn(k8sResourceModule, 'k8sPatch')
      .mockResolvedValue(testInstallPlan);

    const manualApprovalObj = {
      ...obj,
      spec: {
        ...obj.spec,
        approval: InstallPlanApproval.Manual,
        approved: false,
      },
    };

    renderWithProviders(<InstallPlanPreview obj={manualApprovalObj} />);

    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));

    await waitFor(() => {
      expect(k8sPatchSpy).toHaveBeenCalledWith(InstallPlanModel, manualApprovalObj, [
        {
          op: 'replace',
          path: '/spec/approved',
          value: true,
        },
      ]);
    });
  });

  it('renders button to deny install plan if requires approval', () => {
    useAccessReviewMock.mockReturnValue(true);
    renderWithProviders(
      <InstallPlanPreview
        obj={{
          ...obj,
          spec: {
            ...obj.spec,
            approval: InstallPlanApproval.Manual,
            approved: false,
          },
        }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Deny' })).toBeVisible();
  });

  it('renders section for each resolving `ClusterServiceVersion`', () => {
    useAccessReviewMock.mockReturnValue(false);
    renderWithProviders(<InstallPlanPreview obj={obj} />);

    // Check that the component name is rendered as a heading
    expect(screen.getByRole('heading', { name: 'testoperator.v1.0.0' })).toBeVisible();

    // Check that table rows are rendered
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeGreaterThan(0);
  });

  it('renders link to view install plan component if it exists', () => {
    useAccessReviewMock.mockReturnValue(false);
    renderWithProviders(<InstallPlanPreview obj={obj} />);

    expect(screen.getByRole('link', { name: obj.status.plan[0].resource.name })).toBeVisible();
  });

  it('renders link to open preview modal for install plan component if not created yet', () => {
    useAccessReviewMock.mockReturnValue(false);
    const modalSpy = jest.spyOn(modal, 'installPlanPreviewModal').mockReturnValue(null);

    renderWithProviders(<InstallPlanPreview obj={obj} />);

    // Find the button for the second resource (status: 'Unknown')
    const previewButton = screen.getByRole('button', { name: obj.status.plan[1].resource.name });
    expect(previewButton).toBeVisible();

    fireEvent.click(previewButton);

    expect(modalSpy).toHaveBeenCalledWith({ stepResource: obj.status.plan[1].resource });
  });
});

describe('InstallPlanDetails', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders link to "Components" tab if install plan needs approval', () => {
    useAccessReviewMock.mockReturnValue(true);
    const installPlan = {
      ...testInstallPlan,
      metadata: { ...testInstallPlan.metadata },
      spec: {
        ...testInstallPlan.spec,
        approval: InstallPlanApproval.Manual,
        approved: false,
      },
      status: { ...testInstallPlan.status },
    };

    renderWithProviders(<InstallPlanDetails obj={installPlan} />);

    // Find the link by its accessible name
    const previewLink = screen.getByRole('link', { name: /Preview InstallPlan/ });
    expect(previewLink).toBeVisible();
    expect(previewLink).toHaveAttribute(
      'href',
      `/k8s/ns/default/${referenceForModel(InstallPlanModel)}/${
        testInstallPlan.metadata.name
      }/components`,
    );
  });

  it('does not render link to "Components" tab if install plan does not need approval"', () => {
    useAccessReviewMock.mockReturnValue(true);
    renderWithProviders(<InstallPlanDetails obj={testInstallPlan} />);

    expect(screen.queryByRole('button', { name: 'Preview InstallPlan' })).not.toBeInTheDocument();
  });
});

describe('InstallPlanDetailsPage', () => {
  beforeEach(() => {
    jest
      .spyOn(Router, 'useParams')
      .mockReturnValue({ ns: 'default', name: testInstallPlan.metadata.name });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders without errors', () => {
    expect(() => {
      renderWithProviders(<InstallPlanDetailsPage />);
    }).not.toThrow();
  });
});
