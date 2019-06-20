import { pipelineRunFilterReducer } from '../pipeline-filter-reducer';

const mockPipelineRuns = [
  { status: {} },
  { status: { conditions: [] } },
  { status: { conditions: [{}] } },
  { status: { conditions: [{ status: 'False', type: 'Succeeded' }] } },
  { status: { conditions: [{ status: 'True', type: 'Succeeded' }] } },
  {
    status: {
      conditions: [{ status: 'True', type: 'Failure' }, { status: 'False', type: 'Succeeded' }],
    },
  },
  {
    status: {
      conditions: [{ status: 'True', type: 'Failure' }, { status: 'True', type: 'Succeeded' }],
    },
  },
  {
    status: {
      conditions: [
        { status: 'False', type: 'Failure' },
        { status: 'True', type: 'Succeeded' },
        { status: 'False', type: 'Failure' },
      ],
    },
  },
  { status: { conditions: [{ status: 'Unknown', type: 'Succeeded' }] } },
];

describe('Check PipelineRun Filter Reducer applied to the following:', () => {
  it('1. Pipelinerun with empty status object', () => {
    const reducerOutput = pipelineRunFilterReducer(mockPipelineRuns[0]);
    expect(reducerOutput).toBe('-');
  });
  it('2. Pipelinerun with empty conditions array', () => {
    const reducerOutput = pipelineRunFilterReducer(mockPipelineRuns[1]);
    expect(reducerOutput).toBe('-');
  });
  it('3. Pipelinerun with first element of condition array without status', () => {
    const reducerOutput = pipelineRunFilterReducer(mockPipelineRuns[2]);
    expect(reducerOutput).toBe('-');
  });
  it('4. Pipelinerun with first element of condition array with type as "Succeeded" & status as "False"', () => {
    const reducerOutput = pipelineRunFilterReducer(mockPipelineRuns[3]);
    expect(reducerOutput).toBe('Failed');
  });
  it('5. Pipelinerun with first element of condition array with type as "Succeeded" & status as "True"', () => {
    const reducerOutput = pipelineRunFilterReducer(mockPipelineRuns[4]);
    expect(reducerOutput).toBe('Succeeded');
  });
  it('6. Pipelinerun with second element of condition array with type as "Succeeded" & status as "False"', () => {
    const reducerOutput = pipelineRunFilterReducer(mockPipelineRuns[5]);
    expect(reducerOutput).toBe('Failed');
  });
  it('7. Pipelinerun with second element of condition array with type as "Succeeded" & status as "True"', () => {
    const reducerOutput = pipelineRunFilterReducer(mockPipelineRuns[6]);
    expect(reducerOutput).toBe('Succeeded');
  });
  it('8. Pipelinerun with second element of condition array with type as "Succeeded" & status as "True" and additional condition with type as "Failure"', () => {
    const reducerOutput = pipelineRunFilterReducer(mockPipelineRuns[7]);
    expect(reducerOutput).toBe('Succeeded');
  });
  it('9. Pipelinerun with first element of condition array with type as "Succeeded" & status as "Unknown"', () => {
    const reducerOutput = pipelineRunFilterReducer(mockPipelineRuns[8]);
    expect(reducerOutput).toBe('Running');
  });
});
