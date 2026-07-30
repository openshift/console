import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as _ from 'lodash';
import { modelFor } from '@console/internal/module/k8s';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { testSubscription, testInstallPlan } from '../../../../mocks';
import { SubscriptionModel, InstallPlanModel } from '../../../models';
import { InstallPlanApproval } from '../../../types';
import type { InstallPlanApprovalModalProps } from '../installplan-approval-modal';
import { InstallPlanApprovalModal } from '../installplan-approval-modal';

jest.mock('@console/internal/module/k8s', () => ({
  ...jest.requireActual('@console/internal/module/k8s'),
  modelFor: jest.fn(),
}));

jest.mock('@console/shared/src/components/modals/ModalFooterWithAlerts', () => ({
  ModalFooterWithAlerts: jest.fn(({ children }) => <div>{children}</div>),
}));

const mockModelFor = modelFor as jest.Mock;

describe('InstallPlanApprovalModal', () => {
  let installPlanApprovalModalProps: InstallPlanApprovalModalProps;

  beforeEach(() => {
    jest.clearAllMocks();

    installPlanApprovalModalProps = {
      obj: { ...testSubscription },
      k8sUpdate: jest.fn(() => Promise.resolve()),
      close: jest.fn(),
      cancel: jest.fn(),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders modal with correct title', () => {
    renderWithProviders(<InstallPlanApprovalModal {...installPlanApprovalModalProps} />);

    expect(screen.getByText('Change update approval strategy')).toBeVisible();
  });

  it('renders two radio buttons for approval strategies', () => {
    renderWithProviders(<InstallPlanApprovalModal {...installPlanApprovalModalProps} />);

    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(2);
    expect(screen.getByRole('radio', { name: 'Automatic (default)' })).toBeVisible();
    expect(screen.getByRole('radio', { name: 'Manual' })).toBeVisible();
  });

  it('pre-selects Automatic when subscription uses automatic approval', () => {
    renderWithProviders(<InstallPlanApprovalModal {...installPlanApprovalModalProps} />);

    const automaticRadio = screen.getByRole('radio', { name: 'Automatic (default)' });
    const manualRadio = screen.getByRole('radio', { name: 'Manual' });

    expect(automaticRadio).toBeChecked();
    expect(manualRadio).not.toBeChecked();
  });

  it('pre-selects Manual when install plan uses manual approval', () => {
    const installPlan = _.cloneDeep(testInstallPlan);
    installPlan.spec.approval = InstallPlanApproval.Manual;

    renderWithProviders(
      <InstallPlanApprovalModal {...installPlanApprovalModalProps} obj={installPlan} />,
    );

    const automaticRadio = screen.getByRole('radio', { name: 'Automatic (default)' });
    const manualRadio = screen.getByRole('radio', { name: 'Manual' });

    expect(automaticRadio).not.toBeChecked();
    expect(manualRadio).toBeChecked();
  });

  it('calls k8sUpdate with updated subscription when form is submitted', async () => {
    const user = userEvent.setup();
    mockModelFor.mockReturnValue(SubscriptionModel);

    renderWithProviders(<InstallPlanApprovalModal {...installPlanApprovalModalProps} />);

    const manualRadio = screen.getByRole('radio', { name: 'Manual' });
    await user.click(manualRadio);

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(installPlanApprovalModalProps.k8sUpdate).toHaveBeenCalledTimes(1);
    });

    expect(installPlanApprovalModalProps.k8sUpdate).toHaveBeenCalledWith(
      SubscriptionModel,
      expect.objectContaining({
        spec: expect.objectContaining({
          installPlanApproval: InstallPlanApproval.Manual,
        }),
      }),
    );
  });

  it('calls k8sUpdate with updated install plan when form is submitted', async () => {
    const user = userEvent.setup();
    const installPlan = _.cloneDeep(testInstallPlan);
    mockModelFor.mockReturnValue(InstallPlanModel);

    renderWithProviders(
      <InstallPlanApprovalModal {...installPlanApprovalModalProps} obj={installPlan} />,
    );

    const manualRadio = screen.getByRole('radio', { name: 'Manual' });
    await user.click(manualRadio);

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(installPlanApprovalModalProps.k8sUpdate).toHaveBeenCalledTimes(1);
    });

    expect(installPlanApprovalModalProps.k8sUpdate).toHaveBeenCalledWith(
      InstallPlanModel,
      expect.objectContaining({
        spec: expect.objectContaining({
          approval: InstallPlanApproval.Manual,
        }),
      }),
    );
  });

  it('calls close callback after successful submit', async () => {
    const user = userEvent.setup();
    mockModelFor.mockReturnValue(SubscriptionModel);

    renderWithProviders(<InstallPlanApprovalModal {...installPlanApprovalModalProps} />);

    // Save stays disabled when the selected strategy matches the resource; change first so submit runs.
    await user.click(screen.getByRole('radio', { name: 'Manual' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(installPlanApprovalModalProps.close).toHaveBeenCalledTimes(1);
    });
  });
});
