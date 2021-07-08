import * as React from 'react';
import { shallow } from 'enzyme';
import { PipelineRunWorkspace } from '../../../../types';
import EmptyDirectoriesSection from '../EmptyDirectoriesSection';

describe('EmptyDirectoriesSection', () => {
  it('should handle nulls', () => {
    expect(shallow(<EmptyDirectoriesSection workspaces={null} />).isEmptyRender()).toBe(true);
    expect(shallow(<EmptyDirectoriesSection workspaces={undefined} />).isEmptyRender()).toBe(true);
  });

  it('should not render if there are no workspaces', () => {
    expect(shallow(<EmptyDirectoriesSection workspaces={[]} />).isEmptyRender()).toBe(true);
  });

  it('should not render if provided non-emptyDirectory workspaces', () => {
    const workspaces: PipelineRunWorkspace[] = [
      { name: 'test', persistentVolumeClaim: { claimName: 'test' } },
      { name: 'test2', configMap: { name: 'test' } },
      { name: 'test3', secret: { secretName: 'test' } },
    ];
    expect(shallow(<EmptyDirectoriesSection workspaces={workspaces} />).isEmptyRender()).toBe(true);
  });

  it('should render the empty directories section if there is at least one empty directory', () => {
    const workspaces: PipelineRunWorkspace[] = [{ name: 'test', emptyDir: {} }];
    const wrapper = shallow(<EmptyDirectoriesSection workspaces={workspaces} />);
    expect(wrapper.find('[data-test-id="empty-directories-section"]').exists()).toBe(true);
  });

  it('should render a wrapper for each empty directory', () => {
    const workspaces: PipelineRunWorkspace[] = [
      { name: 'test', emptyDir: {} },
      { name: 'test2', emptyDir: {} },
      { name: 'test3', emptyDir: {} },
    ];
    const wrapper = shallow(<EmptyDirectoriesSection workspaces={workspaces} />);
    expect(wrapper.find('[data-test-id="empty-directory-workspace"]')).toHaveLength(3);
  });

  it('should render just emptyDirectories when mixed in with others', () => {
    const workspaces: PipelineRunWorkspace[] = [
      { name: 'test', emptyDir: {} },
      { name: 'test2', persistentVolumeClaim: { claimName: 'test' } },
      { name: 'test3', configMap: { name: 'test' } },
      { name: 'test4', secret: { secretName: 'test' } },
    ];
    const wrapper = shallow(<EmptyDirectoriesSection workspaces={workspaces} />);
    expect(wrapper.find('[data-test-id="empty-directory-workspace"]')).toHaveLength(1);
  });
});
