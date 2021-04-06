import * as React from 'react';
import { ShallowWrapper, shallow } from 'enzyme';
import WorkspaceDefinitionList, { WorkspaceDefinitionListProps } from '../WorkspaceDefinitionList';
import { pipelineTestData, PipelineExampleNames } from '../../../../test-data/pipeline-data';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

describe('WorkspaceDefinitionList', () => {
  let workspaceDefinitionListWrapper: ShallowWrapper<WorkspaceDefinitionListProps>;
  let workspaceDefinitionListWrapperProps: WorkspaceDefinitionListProps;

  it('Should not render if no workspaces are found', () => {
    workspaceDefinitionListWrapperProps = {
      workspaces: null,
    };
    workspaceDefinitionListWrapper = shallow(
      <WorkspaceDefinitionList {...workspaceDefinitionListWrapperProps} />,
    );
    expect(workspaceDefinitionListWrapper.isEmptyRender()).toBe(true);
  });

  it('Should render workspace list', () => {
    const { pipeline } = pipelineTestData[PipelineExampleNames.WORKSPACE_PIPELINE];
    workspaceDefinitionListWrapperProps = {
      workspaces: pipeline.spec.workspaces,
    };
    workspaceDefinitionListWrapper = shallow(
      <WorkspaceDefinitionList {...workspaceDefinitionListWrapperProps} />,
    );
    const workspaces = workspaceDefinitionListWrapper.find('dd').find('div');

    expect(workspaces.length).toBe(3);
  });

  it('Should show optional for optional workspaces', () => {
    const { pipeline } = pipelineTestData[PipelineExampleNames.WORKSPACE_PIPELINE];
    workspaceDefinitionListWrapperProps = {
      workspaces: pipeline.spec.workspaces,
    };
    workspaceDefinitionListWrapper = shallow(
      <WorkspaceDefinitionList {...workspaceDefinitionListWrapperProps} />,
    );
    const workspaces = workspaceDefinitionListWrapper.find('dd').find('div');

    expect(workspaces.length).toBe(3);
    expect(workspaces.at(0).text()).toBe(
      `${pipeline.spec.workspaces[0].name} (pipelines-plugin~optional)`,
    );
    expect(workspaces.at(1).text()).toBe(pipeline.spec.workspaces[1].name);
    expect(workspaces.at(2).text()).toBe(pipeline.spec.workspaces[2].name);
  });
});
