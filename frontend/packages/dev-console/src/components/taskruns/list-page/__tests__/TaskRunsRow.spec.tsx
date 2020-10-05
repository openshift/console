import { shallow } from 'enzyme';
import { TableData, RowFunctionArgs } from '@console/internal/components/factory';
import { TaskRunKind } from '../../../../utils/pipeline-augment';
import TaskRunsRow from '../TaskRunsRow';
import { ResourceLink, Timestamp } from '@console/internal/components/utils';

let taskRunsData: RowFunctionArgs<TaskRunKind>;

describe('TaskRunsRow', () => {
  beforeEach(() => {
    taskRunsData = {
      obj: {
        metadata: {
          uid: '121231',
          name: 'task-run',
          namespace: 'xyz',
          labels: {
            'tekton.dev/pipeline': 'pipeline1',
          },
        },
        spec: {
          taskRef: {
            name: 'task1',
          },
        },
        status: {
          podName: 'pod-1',
          startTime: '-',
        },
      },
      customData: {
        showPipelineColumn: true,
      },
      index: 0,
      key: '0',
      style: {
        height: 'auto',
        left: 0,
        position: 'absolute',
        top: 0,
        width: '100%',
      },
      columns: null,
      isScrolling: true,
    };
  });

  it('should show the pipeline column', () => {
    const wrapper = shallow(TaskRunsRow(taskRunsData));
    expect(wrapper.find(TableData)).toHaveLength(8);
  });

  it('should render proper data', () => {
    const wrapper = shallow(TaskRunsRow(taskRunsData));
    let taskData = wrapper.find(TableData).at(0);
    expect(taskData.find(ResourceLink).props().name).toBe('task-run');
    taskData = wrapper.find(TableData).at(1);
    expect(taskData.find(ResourceLink).props().name).toBe('xyz');
    taskData = wrapper.find(TableData).at(2);
    expect(taskData.find(ResourceLink).props().name).toBe('pipeline1');
    taskData = wrapper.find(TableData).at(3);
    expect(taskData.find(ResourceLink).props().name).toBe('task1');
    taskData = wrapper.find(TableData).at(4);
    expect(taskData.find(ResourceLink).props().name).toBe('pod-1');
    taskData = wrapper.find(TableData).at(6);
    expect(taskData.find(Timestamp).props().timestamp).toBe('-');
  });

  it('should not show the pipeline column', () => {
    taskRunsData.customData.showPipelineColumn = false;
    const wrapper = shallow(TaskRunsRow(taskRunsData));
    expect(wrapper.find(TableData)).toHaveLength(7);
  });
});
