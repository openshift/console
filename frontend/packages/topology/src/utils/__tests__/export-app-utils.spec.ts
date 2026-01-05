import * as k8sResourceModule from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource';
import { mockExportData } from '../../components/export-app/__tests__/export-data';
import { ExportModel } from '../../models/gitops-primer';
import {
  createExportResource,
  getExportAppData,
  getExportResource,
  killExportResource,
} from '../export-app-utils';

jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource', () => ({
  ...jest.requireActual('@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource'),
  k8sCreate: jest.fn(),
  k8sGet: jest.fn(),
  k8sKill: jest.fn(),
}));

const k8sCreateMock = k8sResourceModule.k8sCreate as jest.Mock;
const k8sGetMock = k8sResourceModule.k8sGet as jest.Mock;
const k8sKillMock = k8sResourceModule.k8sKill as jest.Mock;

describe('export-app-utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create export resource', async () => {
    k8sCreateMock.mockReturnValueOnce(Promise.resolve(mockExportData));
    const createResData = getExportAppData('my-export', 'my-app');
    const exportRes = await createExportResource(createResData);
    expect(exportRes).toEqual(mockExportData);
    expect(k8sCreateMock).toHaveBeenCalledTimes(1);
    expect(k8sCreateMock).toHaveBeenCalledWith(ExportModel, createResData);
  });

  it('should get export resource', async () => {
    k8sGetMock.mockReturnValueOnce(Promise.resolve(mockExportData));
    const exportRes = await getExportResource('my-export', 'my-app');
    expect(exportRes).toEqual(mockExportData);
    expect(k8sGetMock).toHaveBeenCalledTimes(1);
    expect(k8sGetMock).toHaveBeenCalledWith(ExportModel, 'my-export', 'my-app');
  });

  it('should kill export resource', async () => {
    k8sKillMock.mockReturnValueOnce(Promise.resolve());
    await killExportResource(mockExportData);
    expect(k8sKillMock).toHaveBeenCalledTimes(1);
    expect(k8sKillMock).toHaveBeenCalledWith(ExportModel, mockExportData);
  });
});
