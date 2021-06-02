import * as React from 'react';
import { shallow } from 'enzyme';
import { ResourceLink } from '@console/internal/components/utils';
import { PipelineRunWorkspace } from '../../../../types';
import WorkspaceResourcesSection from '../WorkspaceResourcesSection';

describe('WorkspaceResourcesSection', () => {
  it('should handle nulls', () => {
    expect(
      shallow(<WorkspaceResourcesSection namespace={null} workspaces={null} />).isEmptyRender(),
    ).toBe(true);
    expect(
      shallow(
        <WorkspaceResourcesSection namespace={null} workspaces={undefined} />,
      ).isEmptyRender(),
    ).toBe(true);
    expect(
      shallow(
        <WorkspaceResourcesSection namespace={undefined} workspaces={undefined} />,
      ).isEmptyRender(),
    ).toBe(true);
    expect(
      shallow(
        <WorkspaceResourcesSection namespace={undefined} workspaces={null} />,
      ).isEmptyRender(),
    ).toBe(true);
  });

  it('should ignore emptyDirectories', () => {
    expect(
      shallow(
        <WorkspaceResourcesSection
          namespace="test"
          workspaces={[{ name: 'test', emptyDir: {} }]}
        />,
      ).isEmptyRender(),
    ).toBe(true);
  });

  it('should ignore unknown items', () => {
    expect(
      shallow(
        <WorkspaceResourcesSection
          namespace="test"
          workspaces={[{ name: 'test', something: 'test' }]}
        />,
      ).isEmptyRender(),
    ).toBe(true);
  });

  it('should render the section if provided with one of the accepted types', () => {
    const hasSectionForWorkspace = (workspace: PipelineRunWorkspace) => {
      expect(
        shallow(<WorkspaceResourcesSection namespace="test" workspaces={[workspace]} />)
          .find('[data-test-id="workspace-resources-section"]')
          .exists(),
      ).toBe(true);
    };
    hasSectionForWorkspace({ name: 'test', persistentVolumeClaim: { claimName: 'test' } });
    hasSectionForWorkspace({ name: 'test', configMap: { name: 'test' } });
    hasSectionForWorkspace({ name: 'test', secret: { secretName: 'test' } });
  });

  it('should render known ResourceLinks', () => {
    const resourceLinkHasDataTestId = (workspace: PipelineRunWorkspace) => {
      const wrapper = shallow(
        <WorkspaceResourcesSection namespace="test" workspaces={[workspace]} />,
      );
      expect(wrapper.find(ResourceLink).exists()).toBe(true);
    };
    resourceLinkHasDataTestId({ name: 'test', persistentVolumeClaim: { claimName: 'test' } });
    resourceLinkHasDataTestId({ name: 'test', configMap: { name: 'test' } });
    resourceLinkHasDataTestId({ name: 'test', secret: { secretName: 'test' } });
  });
});
