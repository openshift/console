import * as React from 'react';
import { shallow } from 'enzyme';
import { act } from 'react-dom/test-utils';
import * as utils from '@console/internal/components/utils/rbac';
import * as k8s from '@console/internal/module/k8s';
import * as useToast from '@console/shared/src/components/toast/index';
import * as useFlag from '@console/shared/src/hooks/flag';
import * as useIsMobile from '@console/shared/src/hooks/useIsMobile';
import * as useUserSettings from '@console/shared/src/hooks/useUserSettings';
import { ExportModel } from '../../../models';
import ExportApplication from '../ExportApplication';
import { mockExportData } from './export-data';

describe('ExportApplication', () => {
  const spyUseAccessReview = jest.spyOn(utils, 'useAccessReview');
  const spyUseFlag = jest.spyOn(useFlag, 'useFlag');
  const spyUseIsMobile = jest.spyOn(useIsMobile, 'useIsMobile');
  const spyUseToast = jest.spyOn(useToast, 'useToast');
  const spyUseUserSettings = jest.spyOn(useUserSettings, 'useUserSettings');

  beforeEach(() => {
    spyUseToast.mockReturnValue({ addToast: (v) => ({ v }) } as any);
    spyUseUserSettings.mockReturnValue([{}, jest.fn(), false]);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render export app btn when feature flag is present and user has access export CR and not mobile', () => {
    spyUseFlag.mockReturnValue(true);
    spyUseAccessReview.mockReturnValue(true);
    spyUseIsMobile.mockReturnValue(false);

    const wrapper = shallow(<ExportApplication namespace="my-app" isDisabled={false} />);
    expect(wrapper.find('[data-test="export-app-btn"]').exists()).toBe(true);
  });

  it('should not render export app btn when feature flag is present but user do not has access to create export CR and not mobile', () => {
    spyUseFlag.mockReturnValue(true);
    spyUseAccessReview.mockReturnValue(false);
    spyUseIsMobile.mockReturnValue(false);

    const wrapper = shallow(<ExportApplication namespace="my-app" isDisabled={false} />);
    expect(wrapper.find('[data-test="export-app-btn"]').exists()).toBe(false);
  });

  it('should not render export app btn when feature flag is present and user has access to create export CR but on mobile', () => {
    spyUseFlag.mockReturnValue(true);
    spyUseAccessReview.mockReturnValue(true);
    spyUseIsMobile.mockReturnValue(true);

    const wrapper = shallow(<ExportApplication namespace="my-app" isDisabled={false} />);
    expect(wrapper.find('[data-test="export-app-btn"]').exists()).toBe(false);
  });

  it('should call k8sGet, k8sKill and k8sCreate with correct data on click of export button', async () => {
    const spyk8sGet = jest.spyOn(k8s, 'k8sGet');
    const spyk8sKill = jest.spyOn(k8s, 'k8sKill');
    const spyk8sCreate = jest.spyOn(k8s, 'k8sCreate');
    spyk8sGet.mockReturnValue(Promise.resolve(mockExportData));
    spyk8sKill.mockReturnValue(Promise.resolve(mockExportData));
    spyk8sCreate.mockReturnValue(Promise.resolve(mockExportData));
    spyUseFlag.mockReturnValue(true);
    spyUseAccessReview.mockReturnValue(true);
    spyUseIsMobile.mockReturnValue(false);

    const wrapper = shallow(<ExportApplication namespace="my-app" isDisabled={false} />);
    expect(wrapper.find('[data-test="export-app-btn"]').exists()).toBe(true);
    await act(async () => {
      wrapper.find('[data-test="export-app-btn"]').simulate('click');
    });

    expect(spyk8sGet).toHaveBeenCalledTimes(1);
    expect(spyk8sGet).toHaveBeenCalledWith(ExportModel, 'primer', 'my-app');
    expect(spyk8sKill).toHaveBeenCalledTimes(1);
    expect(spyk8sKill).toHaveBeenCalledWith(ExportModel, mockExportData);
    expect(spyk8sCreate).toHaveBeenCalledTimes(1);
    expect(spyk8sCreate).toHaveBeenCalledWith(ExportModel, {
      apiVersion: 'primer.gitops.io/v1alpha1',
      kind: 'Export',
      metadata: { name: 'primer', namespace: 'my-app' },
      spec: { method: 'download' },
    });
  });
});
