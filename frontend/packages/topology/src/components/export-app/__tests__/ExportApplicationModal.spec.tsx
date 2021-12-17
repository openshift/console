import * as React from 'react';
import { shallow } from 'enzyme';
import { ExportApplicationModal } from '../ExportApplicationModal';
import ExportViewLogButton from '../ExportViewLogButton';

describe('ExportApplicationModal', () => {
  it('should show only one button to close modal', () => {
    const wrapper = shallow(<ExportApplicationModal namespace="my-app" />);
    expect(wrapper.find('[data-test="export-close-btn"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="export-canel-btn"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="export-restart-btn"]').exists()).toBe(false);
  });

  it('should show buttons to cancel and restart export', () => {
    const wrapper = shallow(
      <ExportApplicationModal
        namespace="my-app"
        onCancelExport={jest.fn()}
        onRestartExport={jest.fn()}
      />,
    );
    expect(wrapper.find('[data-test="export-close-btn"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="export-cancel-btn"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="export-restart-btn"]').exists()).toBe(true);
  });

  it('should call cancel export on click', () => {
    const onCancelExport = jest.fn();
    const wrapper = shallow(
      <ExportApplicationModal
        namespace="my-app"
        onCancelExport={onCancelExport}
        onRestartExport={jest.fn()}
      />,
    );
    wrapper.find('[data-test="export-cancel-btn"]').simulate('click');
    expect(onCancelExport).toHaveBeenCalled();
  });

  it('should call restart export on click', () => {
    const onRestartExport = jest.fn();
    const wrapper = shallow(
      <ExportApplicationModal
        namespace="my-app"
        onCancelExport={jest.fn()}
        onRestartExport={onRestartExport}
      />,
    );
    wrapper.find('[data-test="export-restart-btn"]').simulate('click');
    expect(onRestartExport).toHaveBeenCalled();
  });

  it('should contain view log button and call onViewLog', () => {
    const wrapper = shallow(
      <ExportApplicationModal
        namespace="my-app"
        onCancelExport={jest.fn()}
        onRestartExport={jest.fn()}
      />,
    );
    expect(wrapper.find(ExportViewLogButton).exists()).toBe(true);
  });
});
