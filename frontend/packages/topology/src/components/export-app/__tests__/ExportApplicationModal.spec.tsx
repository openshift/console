import * as React from 'react';
import { shallow } from 'enzyme';
import * as _ from 'lodash';
import { act } from 'react-dom/test-utils';
import * as k8s from '@console/internal/module/k8s';
import * as shared from '@console/shared';
import { getExportAppData } from '@console/topology/src/utils/export-app-utils';
import { ExportModel } from '../../../models';
import { ExportApplicationModal } from '../ExportApplicationModal';
import ExportViewLogButton from '../ExportViewLogButton';
import { mockExportData } from './export-data';

describe('ExportApplicationModal', () => {
  const spyUseToast = jest.spyOn(shared, 'useToast');
  const spyUseUserSettings = jest.spyOn(shared, 'useUserSettings');

  beforeEach(() => {
    spyUseToast.mockReturnValue({ addToast: (v) => ({ v }) });
    spyUseUserSettings.mockReturnValue([{}, jest.fn(), false]);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should show cancel and  ok buttons when export app resource is not found', async () => {
    const wrapper = shallow(<ExportApplicationModal name="my-export" namespace="my-app" />);
    expect(wrapper.find('[data-test="cancel-btn"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="close-btn"]').exists()).toBe(true);
  });

  it('should show cancel export, restart export and  ok buttons when export app is in progress', () => {
    const exportData = _.cloneDeep(mockExportData);
    exportData.status.completed = false;
    const wrapper = shallow(
      <ExportApplicationModal name="my-export" namespace="my-app" exportResource={exportData} />,
    );
    expect(wrapper.find('[data-test="export-close-btn"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="export-cancel-btn"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="export-restart-btn"]').exists()).toBe(true);
  });

  it('should contain view log button and call onViewLog', () => {
    const exportData = _.cloneDeep(mockExportData);
    exportData.status.completed = false;
    const wrapper = shallow(
      <ExportApplicationModal name="my-export" namespace="my-app" exportResource={exportData} />,
    );
    expect(wrapper.find(ExportViewLogButton).exists()).toBe(true);
  });

  it('should show cancel and ok buttons when export app resource is created', async () => {
    const wrapper = shallow(
      <ExportApplicationModal
        name="my-export"
        namespace="my-app"
        exportResource={mockExportData}
      />,
    );
    expect(wrapper.find('[data-test="cancel-btn"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="close-btn"]').exists()).toBe(true);
  });

  it('should call k8sCreate with correct data on click of Ok button when the export resource is not created', async () => {
    const spyk8sCreate = jest.spyOn(k8s, 'k8sCreate');
    const wrapper = shallow(
      <ExportApplicationModal namespace="my-app" name="my-export" cancel={jest.fn()} />,
    );
    await act(async () => {
      wrapper.find('[data-test="close-btn"]').simulate('click');
    });

    expect(spyk8sCreate).toHaveBeenCalledTimes(1);
    expect(spyk8sCreate).toHaveBeenCalledWith(ExportModel, getExportAppData('my-export', 'my-app'));
  });

  it('should call k8sKill and k8sCreate with correct data on click of Ok button when the export resource already exists', async () => {
    const spyk8sKill = jest.spyOn(k8s, 'k8sKill');
    const spyk8sCreate = jest.spyOn(k8s, 'k8sCreate');

    const wrapper = shallow(
      <ExportApplicationModal
        name="my-export"
        namespace="my-app"
        exportResource={mockExportData}
        cancel={jest.fn()}
      />,
    );
    await act(async () => {
      wrapper.find('[data-test="close-btn"]').simulate('click');
    });

    expect(spyk8sKill).toHaveBeenCalledTimes(1);
    expect(spyk8sKill).toHaveBeenCalledWith(ExportModel, mockExportData);
    expect(spyk8sCreate).toHaveBeenCalledTimes(1);
    expect(spyk8sCreate).toHaveBeenCalledWith(ExportModel, getExportAppData('my-export', 'my-app'));
  });

  it('should call k8sKill and k8sCreate with correct data on click of restart button when export app is in progress', async () => {
    const spyk8sKill = jest.spyOn(k8s, 'k8sKill');
    const spyk8sCreate = jest.spyOn(k8s, 'k8sCreate');
    const exportData = _.cloneDeep(mockExportData);
    exportData.status.completed = false;
    const wrapper = shallow(
      <ExportApplicationModal name="my-export" namespace="my-app" exportResource={exportData} />,
    );

    await act(async () => {
      wrapper.find('[data-test="export-restart-btn"]').simulate('click');
    });

    expect(spyk8sKill).toHaveBeenCalledTimes(1);
    expect(spyk8sKill).toHaveBeenCalledWith(ExportModel, exportData);
    expect(spyk8sCreate).toHaveBeenCalledTimes(1);
    expect(spyk8sCreate).toHaveBeenCalledWith(ExportModel, getExportAppData('my-export', 'my-app'));
  });

  it('should call k8sKill with correct data on click of cancel button when export app is in progress', async () => {
    const spyk8sKill = jest.spyOn(k8s, 'k8sKill');
    const exportData = _.cloneDeep(mockExportData);
    exportData.status.completed = false;
    const wrapper = shallow(
      <ExportApplicationModal name="my-export" namespace="my-app" exportResource={exportData} />,
    );

    await act(async () => {
      wrapper.find('[data-test="export-restart-btn"]').simulate('click');
    });

    expect(spyk8sKill).toHaveBeenCalledTimes(1);
    expect(spyk8sKill).toHaveBeenCalledWith(ExportModel, exportData);
  });
});
