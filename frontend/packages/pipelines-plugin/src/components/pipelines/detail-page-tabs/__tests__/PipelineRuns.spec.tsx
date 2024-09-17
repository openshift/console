import * as React from 'react';
import { shallow } from 'enzyme';
import { useFlag } from '@console/shared/src/hooks/flag';
import { ListPage } from '../../../ListPage';
import * as pipelineRunssHooks from '../../../pipelineruns/hooks/usePipelineRuns';
import PipelineRuns from '../PipelineRuns';

jest.mock('@console/shared/src/hooks/flag', () => ({
  useFlag: jest.fn(),
}));

const useFlagMock = useFlag as jest.Mock;

const pipelineRunProps: React.ComponentProps<typeof PipelineRuns> = {
  obj: {
    metadata: {
      name: 'pipeline-a',
    },
    spec: {
      tasks: [{ name: 'task1' }],
    },
  },
  customData: {
    templateNames: [],
    queryPrefix: '',
    metricsLevel: '',
    hasUpdatePermission: true,
  },
};

jest.spyOn(pipelineRunssHooks, 'usePipelineRuns').mockReturnValue([[], true, '']);
useFlagMock.mockReturnValue(true);
const pipelineRunWrapper = shallow(<PipelineRuns {...pipelineRunProps} />);

describe('Pipeline Run List', () => {
  it('Renders a list', () => {
    expect(pipelineRunWrapper.find(ListPage).exists());
  });

  it('List renders PipelineRun resources', () => {
    expect(pipelineRunWrapper.find(ListPage).prop('kind')).toMatch('PipelineRun');
  });
});
