import * as k8s from '@console/internal/module/k8s';
import { mockExportData } from '../../components/export-app/__tests__/export-data';
import { EXPORT_CR_NAME } from '../../const';
import { ExportModel } from '../../models/gitops-primer';
import {
  createExportResource,
  getExportAppData,
  getExportResource,
  killExportResource,
} from '../export-app-utils';

describe('export-app-utils', () => {
  it('should create export resource', async () => {
    const spyk8sCreate = jest.spyOn(k8s, 'k8sCreate');
    spyk8sCreate.mockReturnValueOnce(Promise.resolve(mockExportData));
    const createResData = getExportAppData('my-app');
    const exportRes = await createExportResource(createResData);
    expect(exportRes).toEqual(mockExportData);
    expect(spyk8sCreate).toHaveBeenCalledTimes(1);
    expect(spyk8sCreate).toHaveBeenCalledWith(ExportModel, createResData);
  });

  it('should get export resource', async () => {
    const spyk8sGet = jest.spyOn(k8s, 'k8sGet');
    spyk8sGet.mockReturnValueOnce(Promise.resolve(mockExportData));
    const exportRes = await getExportResource('my-app');
    expect(exportRes).toEqual(mockExportData);
    expect(spyk8sGet).toHaveBeenCalledTimes(1);
    expect(spyk8sGet).toHaveBeenCalledWith(ExportModel, EXPORT_CR_NAME, 'my-app');
  });

  it('should kill export resource', async () => {
    const spyk8sKill = jest.spyOn(k8s, 'k8sKill');
    spyk8sKill.mockReturnValueOnce(Promise.resolve());
    await killExportResource(mockExportData);
    expect(spyk8sKill).toHaveBeenCalledTimes(1);
    expect(spyk8sKill).toHaveBeenCalledWith(ExportModel, mockExportData);
  });
});
