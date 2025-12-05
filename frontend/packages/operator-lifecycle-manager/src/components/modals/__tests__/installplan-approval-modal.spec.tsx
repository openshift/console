import { screen, fireEvent, waitFor } from '@testing-library/react';
import * as _ from 'lodash';
import { modelFor } from '@console/internal/module/k8s';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { testSubscription, testInstallPlan } from '../../../../mocks';
import { SubscriptionModel, InstallPlanModel } from '../../../models';
import { InstallPlanApproval } from '../../../types';
import {
  InstallPlanApprovalModal,
  InstallPlanApprovalModalProps,
} from '../installplan-approval-modal';

jest.mock('@console/internal/module/k8s', () => ({
  ...jest.requireActual('@console/internal/module/k8s'),
  modelFor: jest.fn(),
}));

jest.mock('@console/internal/components/factory/modal', () => ({
  ...jest.requireActual('@console/internal/components/factory/modal'),
  ModalTitle: jest.fn(({ children }) => children),
  ModalBody: jest.fn(({ children }) => children),
  ModalSubmitFooter: jest.fn(() => null),
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
    mockModelFor.mockReturnValue(SubscriptionModel);

    renderWithProviders(<InstallPlanApprovalModal {...installPlanApprovalModalProps} />);

    const manualRadio = screen.getByRole('radio', { name: 'Manual' });
    fireEvent.click(manualRadio);

    const form = screen.getByRole('radio', { name: 'Manual' }).closest('form');
    if (form) {
      fireEvent.submit(form);
    }

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
    const installPlan = _.cloneDeep(testInstallPlan);
    mockModelFor.mockReturnValue(InstallPlanModel);

    renderWithProviders(
      <InstallPlanApprovalModal {...installPlanApprovalModalProps} obj={installPlan} />,
    );

    const manualRadio = screen.getByRole('radio', { name: 'Manual' });
    fireEvent.click(manualRadio);

    const form = screen.getByRole('radio', { name: 'Manual' }).closest('form');
    if (form) {
      fireEvent.submit(form);
    }

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
    renderWithProviders(<InstallPlanApprovalModal {...installPlanApprovalModalProps} />);

    const form = screen.getByRole('radio', { name: 'Automatic (default)' }).closest('form');
    if (form) {
      fireEvent.submit(form);
    }

    await waitFor(() => {
      expect(installPlanApprovalModalProps.close).toHaveBeenCalledTimes(1);
    });
  });
});
