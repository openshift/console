import { screen, fireEvent } from '@testing-library/react';
import * as _ from 'lodash';
import { act } from 'react-dom/test-utils';
import * as k8sResourceModule from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource';
import * as useToastModule from '@console/shared/src/components/toast/useToast';
import * as useUserSettingsModule from '@console/shared/src/hooks/useUserSettings';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { getExportAppData } from '@console/topology/src/utils/export-app-utils';
import { ExportModel } from '../../../models';
import { ExportApplicationModal } from '../ExportApplicationModal';
import { mockExportData } from './export-data';

jest.mock('react-i18next', () => {
  const reactI18next = jest.requireActual('react-i18next');
  return {
    ...reactI18next,
    Trans: () => null,
  };
});

jest.mock('@console/shared/src/components/toast/useToast', () => {
  const actual = jest.requireActual('@console/shared/src/components/toast/useToast');
  return {
    ...actual,
    default: jest.fn(),
  };
});

jest.mock('@console/shared/src/hooks/useUserSettings', () => {
  const actual = jest.requireActual('@console/shared/src/hooks/useUserSettings');
  return {
    ...actual,
    useUserSettings: jest.fn(),
  };
});

jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource', () => {
  const actual = jest.requireActual('@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource');
  return {
    ...actual,
    k8sCreate: jest.fn(),
    k8sKill: jest.fn(),
  };
});

const spyUseToast = useToastModule.default as jest.Mock;
const spyUseUserSettings = useUserSettingsModule.useUserSettings as jest.Mock;
const spyk8sCreate = k8sResourceModule.k8sCreate as jest.Mock;
const spyk8sKill = k8sResourceModule.k8sKill as jest.Mock;

describe('ExportApplicationModal', () => {
  beforeEach(() => {
    spyUseToast.mockReturnValue({ addToast: (v: any) => ({ v }) });
    spyUseUserSettings.mockReturnValue([{}, jest.fn(), false]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should show cancel and  ok buttons when export app resource is not found', async () => {
    renderWithProviders(<ExportApplicationModal name="my-export" namespace="my-app" />);
    expect(screen.getByTestId('cancel-btn')).toBeInTheDocument();
    expect(screen.getByTestId('close-btn')).toBeInTheDocument();
  });

  it('should show cancel export, restart export and ok buttons when export app is in progress', async () => {
    const exportData = _.cloneDeep(mockExportData);
    exportData.status.completed = false;
    renderWithProviders(
      <ExportApplicationModal name="my-export" namespace="my-app" exportResource={exportData} />,
    );
    expect(screen.getByTestId('export-close-btn')).toBeInTheDocument();
    expect(screen.getByTestId('export-cancel-btn')).toBeInTheDocument();
    expect(screen.getByTestId('export-restart-btn')).toBeInTheDocument();
  });

  it('should contain view log button and call onViewLog', () => {
    const exportData = _.cloneDeep(mockExportData);
    exportData.status.completed = false;
    renderWithProviders(
      <ExportApplicationModal name="my-export" namespace="my-app" exportResource={exportData} />,
    );
    expect(screen.getByTestId('export-view-log-btn')).toBeInTheDocument();
  });

  it('should show cancel and ok buttons when export app resource is created', async () => {
    renderWithProviders(
      <ExportApplicationModal
        name="my-export"
        namespace="my-app"
        exportResource={mockExportData}
      />,
    );
    expect(screen.getByTestId('cancel-btn')).toBeInTheDocument();
    expect(screen.getByTestId('close-btn')).toBeInTheDocument();
  });

  it('should call k8sCreate with correct data on click of Ok button when the export resource is not created', async () => {
    renderWithProviders(
      <ExportApplicationModal namespace="my-app" name="my-export" cancel={jest.fn()} />,
    );
    await act(async () => {
      fireEvent.click(screen.getByTestId('close-btn'));
    });

    expect(spyk8sCreate).toHaveBeenCalledTimes(1);
    expect(spyk8sCreate).toHaveBeenCalledWith(ExportModel, getExportAppData('my-export', 'my-app'));
  });

  it('should call k8sKill and k8sCreate with correct data on click of Ok button when the export resource already exists', async () => {
    renderWithProviders(
      <ExportApplicationModal
        name="my-export"
        namespace="my-app"
        exportResource={mockExportData}
        cancel={jest.fn()}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByTestId('close-btn'));
    });

    expect(spyk8sKill).toHaveBeenCalledTimes(1);
    expect(spyk8sKill).toHaveBeenCalledWith(ExportModel, mockExportData);
    expect(spyk8sCreate).toHaveBeenCalledTimes(1);
    expect(spyk8sCreate).toHaveBeenCalledWith(ExportModel, getExportAppData('my-export', 'my-app'));
  });

  it('should call k8sKill and k8sCreate with correct data on click of restart button when export app is in progress', async () => {
    const exportData = _.cloneDeep(mockExportData);
    exportData.status.completed = false;
    renderWithProviders(
      <ExportApplicationModal name="my-export" namespace="my-app" exportResource={exportData} />,
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId('export-restart-btn'));
    });

    expect(spyk8sKill).toHaveBeenCalledTimes(1);
    expect(spyk8sKill).toHaveBeenCalledWith(ExportModel, exportData);
    expect(spyk8sCreate).toHaveBeenCalledTimes(1);
    expect(spyk8sCreate).toHaveBeenCalledWith(ExportModel, getExportAppData('my-export', 'my-app'));
  });

  it('should call k8sKill with correct data on click of cancel button when export app is in progress', async () => {
    const exportData = _.cloneDeep(mockExportData);
    exportData.status.completed = false;
    renderWithProviders(
      <ExportApplicationModal name="my-export" namespace="my-app" exportResource={exportData} />,
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId('export-restart-btn'));
    });

    expect(spyk8sKill).toHaveBeenCalledTimes(1);
    expect(spyk8sKill).toHaveBeenCalledWith(ExportModel, exportData);
  });
});
