import * as React from 'react';
import { shallow } from 'enzyme';
import { TektonWorkspace } from '../../../../types';
import WorkspaceDefinitionList from '../WorkspaceDefinitionList';

describe('WorkspaceDefinitionList', () => {
  it('should handle nulls', () => {
    expect(shallow(<WorkspaceDefinitionList workspaces={null} />).isEmptyRender()).toBe(true);
    expect(shallow(<WorkspaceDefinitionList workspaces={undefined} />).isEmptyRender()).toBe(true);
  });

  it('should not render anything when provided no workspaces', () => {
    expect(shallow(<WorkspaceDefinitionList workspaces={[]} />).isEmptyRender()).toBe(true);
  });

  it('should should render wrapper if at least one workspace is there', () => {
    const workspaces: TektonWorkspace[] = [{ name: 'workspace' }];
    const wrapper = shallow(<WorkspaceDefinitionList workspaces={workspaces} />);
    expect(wrapper.find('[data-test-id="workspace-definition-section"]').exists()).toBe(true);
  });

  it('should have a wrapper for each workspace provided', () => {
    const test = shallow(<WorkspaceDefinitionList workspaces={[{ name: 'workspace' }]} />);
    expect(test.find('[data-test-id="workspace-definition"]')).toHaveLength(1);

    const test2 = shallow(
      <WorkspaceDefinitionList
        workspaces={[{ name: 'workspace' }, { name: 'second-workspace' }]}
      />,
    );
    expect(test2.find('[data-test-id="workspace-definition"]')).toHaveLength(2);
  });

  it('should support optional workspaces', () => {
    const test = shallow(
      <WorkspaceDefinitionList workspaces={[{ name: 'workspace', optional: true }]} />,
    );
    expect(test.find('[data-test-id="workspace-definition-optional"]')).toHaveLength(1);

    const test2 = shallow(
      <WorkspaceDefinitionList
        workspaces={[
          { name: 'workspace', optional: true },
          { name: 'second-workspace', optional: true },
        ]}
      />,
    );
    expect(test2.find('[data-test-id="workspace-definition-optional"]')).toHaveLength(2);
  });

  it('should support a mixture of both optional and not workspaces', () => {
    const test = shallow(
      <WorkspaceDefinitionList
        workspaces={[
          { name: 'workspace', optional: true },
          { name: 'second-workspace', optional: false },
          { name: 'third-workspace' },
        ]}
      />,
    );
    expect(test.find('[data-test-id="workspace-definition-optional"]')).toHaveLength(1);
    expect(test.find('[data-test-id="workspace-definition"]')).toHaveLength(2);
  });
});
