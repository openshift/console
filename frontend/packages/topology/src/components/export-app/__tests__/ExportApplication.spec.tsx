import * as React from 'react';
import { shallow } from 'enzyme';
import { act } from 'react-dom/test-utils';
import * as flagsModule from '@console/dynamic-plugin-sdk/src/utils/flags';
import * as k8sResourceModule from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource';
import * as rbacModule from '@console/internal/components/utils/rbac';
import * as useIsMobileModule from '@console/shared/src/hooks/useIsMobile';
import { ExportModel } from '../../../models';
import ExportApplication from '../ExportApplication';
import { mockExportData } from './export-data';

describe('ExportApplication', () => {
  const spyUseAccessReview = jest.spyOn(rbacModule, 'useAccessReview');
  const spyUseFlag = jest.spyOn(flagsModule, 'useFlag');
  const spyUseIsMobile = jest.spyOn(useIsMobileModule, 'useIsMobile');

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

  it('should call k8sGet with correct data on click of export button', async () => {
    const spyk8sGet = jest.spyOn(k8sResourceModule, 'k8sGet');
    spyk8sGet.mockReturnValue(Promise.resolve(mockExportData));
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
  });
});
