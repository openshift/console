import * as React from 'react';
import { ShallowWrapper, shallow } from 'enzyme';
import { ResourceLink } from '@console/internal/components/utils';
import { SecretModel, PersistentVolumeClaimModel, ConfigMapModel } from '@console/internal/models';
import { taskRunWithWorkspaces } from '../../../taskruns/__tests__/taskrun-test-data';
import WorkspaceResourceLinkList, {
  WorkspaceResourceLinkListProps,
} from '../WorkspaceResourceLinkList';
import VolumeClaimTemplatesLink from '../VolumeClaimTemplateLink';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

describe('WorkspaceResourceLinkList', () => {
  let workspaceResourceListWrapper: ShallowWrapper<WorkspaceResourceLinkListProps>;
  let workspaceResourceListWrapperProps: WorkspaceResourceLinkListProps;

  it('Should not render if no workspaces are found', () => {
    workspaceResourceListWrapperProps = {
      workspaces: taskRunWithWorkspaces[0].spec.workspaces,
      namespace: 'test',
      ownerResourceName: 'test',
    };
    workspaceResourceListWrapper = shallow(
      <WorkspaceResourceLinkList {...workspaceResourceListWrapperProps} />,
    );
    expect(workspaceResourceListWrapper.isEmptyRender()).toBe(true);
  });

  it('Should render correct workspace list with ResourceLink and Text', () => {
    workspaceResourceListWrapperProps = {
      workspaces: taskRunWithWorkspaces[1].spec.workspaces,
      namespace: 'test',
      ownerResourceName: 'test',
    };
    workspaceResourceListWrapper = shallow(
      <WorkspaceResourceLinkList {...workspaceResourceListWrapperProps} />,
    );

    const workspaceResources = workspaceResourceListWrapper.find('dd').find(ResourceLink);
    expect(workspaceResources.length).toBe(3); // Should show 3 resourceLinks and 1 simple text

    // renders correct PVC ResourceLink
    expect(
      workspaceResources
        .at(0)
        .find(ResourceLink)
        .exists(),
    ).toBe(true);

    expect(
      workspaceResources
        .at(0)
        .find(ResourceLink)
        .prop('name'),
    ).toBe(taskRunWithWorkspaces[1].spec.workspaces[0].persistentVolumeClaim.claimName);

    expect(
      workspaceResources
        .at(0)
        .find(ResourceLink)
        .prop('kind'),
    ).toBe(PersistentVolumeClaimModel.kind);

    // renders correct Secret Link
    expect(
      workspaceResources
        .at(1)
        .find(ResourceLink)
        .exists(),
    ).toBe(true);

    expect(
      workspaceResources
        .at(1)
        .find(ResourceLink)
        .prop('name'),
    ).toBe(taskRunWithWorkspaces[1].spec.workspaces[1].secret.secretName);

    expect(
      workspaceResources
        .at(1)
        .find(ResourceLink)
        .prop('kind'),
    ).toBe(SecretModel.kind);

    // renders correct ConfigMaplink
    expect(
      workspaceResources
        .at(2)
        .find(ResourceLink)
        .exists(),
    ).toBe(true);

    expect(
      workspaceResources
        .at(2)
        .find(ResourceLink)
        .prop('name'),
    ).toBe(taskRunWithWorkspaces[1].spec.workspaces[2].configMap.name);

    expect(
      workspaceResources
        .at(2)
        .find(ResourceLink)
        .prop('kind'),
    ).toBe(ConfigMapModel.kind);

    const workspaceText = workspaceResourceListWrapper.find('dd').find('div');
    expect(workspaceText.length).toBe(1); // Should show 3 resourceLinks and 1 simple text
    expect(workspaceText.at(0).text()).toBe(taskRunWithWorkspaces[1].spec.workspaces[3].name);
  });

  it('Should render Workspace Resource section and VolumeClaimTemplate Resource Section', () => {
    workspaceResourceListWrapperProps = {
      workspaces: taskRunWithWorkspaces[3].spec.workspaces,
      namespace: 'test',
      ownerResourceName: 'test',
    };
    workspaceResourceListWrapper = shallow(
      <WorkspaceResourceLinkList {...workspaceResourceListWrapperProps} />,
    );

    const workspaceResources = workspaceResourceListWrapper.find('dd').find(ResourceLink);
    expect(workspaceResources.length).toBe(3); // Should show 3 resourceLinks and separate VolumeClaimTemplateSection
    expect(workspaceResourceListWrapper.find(VolumeClaimTemplatesLink).exists()).toBe(true);
  });
});
